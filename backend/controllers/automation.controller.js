import { Resend } from "resend";
import OpenAI from "openai";
import Job from "../models/job.model.js";
import User from "../models/user.model.js";
import Notification from "../models/notification.model.js";

const resend = new Resend(process.env.RESEND_API_KEY);
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

function stripHtml(html = "") {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<\/(p|div|br|li|h\d)>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+\n/g, "\n")
    .replace(/\n\s+/g, "\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

function extractEmail(raw = "") {
  return raw.match(/<([^>]+)>/)?.[1]?.trim() || raw.trim();
}

async function findUser(emailContent) {
  const toRaw = Array.isArray(emailContent.to)
    ? emailContent.to[0]
    : emailContent.to;
  const toAddress = (typeof toRaw === "object" ? toRaw.email : toRaw) || "";
  const deliveredTo = emailContent.headers?.["delivered-to"] || "";

  const getPrefix = (addr) =>
    addr.split("@")[0].split("+")[0].trim().toLowerCase();
  const prefixes = [getPrefix(toAddress), getPrefix(deliveredTo)];

  const user = await User.findOne({
    inboundPrefix: { $in: prefixes.filter((p) => p) },
  });

  if (user) return user;

  const fromEmail = extractEmail(emailContent.from || "");
  return await User.findOne({ email: fromEmail.toLowerCase() });
}

export const handleResendWebhook = async (req, res) => {
  try {
    const { data, type } = req.body || {};

    if (type !== "email.received") return res.sendStatus(200);
    if (!data?.email_id) return res.status(400).send("Missing email_id");

    const { data: emailContent, error } = await resend.emails.receiving.get(
      data.email_id,
    );

    if (error || !emailContent) {
      console.error("Resend fetch error:", error);
      return res.status(502).send("Failed to fetch email content");
    }

    const text =
      emailContent.text?.trim() || stripHtml(emailContent.html || "");
    const user = await findUser(emailContent);

    if (!user) {
      console.log(
        `❌ No user found for: ${emailContent.from} -> ${emailContent.to}`,
      );
      return res.status(200).send("No user matched.");
    }

    // --- 1. GOOGLE VERIFICATION HANDLER ---
    if (emailContent.from?.toLowerCase().includes("google.com")) {
      const cleanText = text.replace(/[\r\n]+/g, " ");
      const linkMatch = cleanText.match(
        /https:\/\/mail(?:-settings)?\.google\.com\/mail\/v[fu]-[^\s>"]+/,
      );

      if (linkMatch) {
        await Notification.create({
          userId: user._id,
          message: "Action Required: Approve Gmail Forwarding",
          link: linkMatch[0],
          type: "system",
        });
        console.log("🔗 Google Verification Link Captured");
      }
      return res.status(200).send("Verification processed.");
    }

    // --- 2. DUPLICATE CHECK ---
    const existingJob = await Job.findOne({ sourceId: data.email_id });
    if (existingJob)
      return res.status(200).json({ success: true, message: "Duplicate" });

    // --- 3. AI EXTRACTION WITH IMPROVED PROMPT ---
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a job application assistant. Extract info from emails.
          Return JSON: { "company": string, "job_title": string, "location": string, "is_job_receipt": boolean }
          
          RULES:
          - Set is_job_receipt to true if the email is a confirmation of a submitted application.
          - Recognize LinkedIn's "Your application was sent to [Company]" as a receipt.
          - Recognize "Thank you for applying", "Received your application", or "Confirmation of your application".
          - If it's just a job suggestion/alert or marketing, set is_job_receipt to false.`,
        },
        {
          role: "user",
          content: `Subject: ${emailContent.subject}\n\n${text}`,
        },
      ],
      response_format: { type: "json_object" },
    });

    const aiParsed = JSON.parse(completion.choices[0].message.content);

    // --- 4. DEBUG LOGS FOR RENDER ---
    console.log("--- AI DECISION ---");
    console.log("Subject:", emailContent.subject);
    console.log("Is Job Receipt:", aiParsed.is_job_receipt);
    console.log("Company:", aiParsed.company);
    console.log("-------------------");

    // --- 5. DATA PERSISTENCE ---
    if (aiParsed.is_job_receipt) {
      const newJob = await Job.create({
        userId: user._id,
        title: aiParsed.job_title || "New Application",
        company: aiParsed.company || "Unknown Company",
        location: aiParsed.location || "Remote/Unknown",
        status: "applied",
        source: "email",
        sourceId: data.email_id,
        dateApplied: new Date(),
      });

      await Notification.create({
        userId: user._id,
        message: `New Application Tracked: ${aiParsed.job_title} at ${aiParsed.company}`,
        type: "job",
      });

      console.log(`✅ Job Tracked: ${newJob.title} at ${newJob.company}`);
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error("Critical Webhook Error:", err);
    return res.status(500).send("Internal Server Error");
  }
};
