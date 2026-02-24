import { Resend } from "resend";
import OpenAI from "openai";
import Job from "../models/job.model.js";
import User from "../models/user.model.js";
import Notification from "../models/notification.model.js";
import notification from "../models/notification.model.js";

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

    // 🆕 GOOGLE VERIFICATION LINK CAPTURE (Fixed Regex)
    if (emailContent.from?.toLowerCase().includes("google.com")) {
      // 1. Clean the text of newlines only, keeping spaces to help split the URL
      const cleanText = text.replace(/[\r\n]+/g, " ");

      // 2. Look for the link - stopping at the first space or quote
      const linkMatch = cleanText.match(
        /https:\/\/mail(?:-settings)?\.google\.com\/mail\/v[fu]-[^\s>"]+/,
      );

      if (linkMatch) {
        const fullLink = linkMatch[0];

        console.log("====================================================");
        console.log("🔗 CLEAN GOOGLE LINK:");
        console.log(fullLink);
        console.log("====================================================");

        await Notification.create({
          userId: user._id,
          message: "Action Required: Approve Gmail Forwarding",
          link: fullLink,
          type: "system",
        });
      }
      return res.status(200).send("Verification processed.");
    }

    const existingJob = await Job.findOne({ sourceId: data.email_id });
    if (existingJob)
      return res.status(200).json({ success: true, message: "Duplicate" });

    // 🧠 AI EXTRACTION
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            'Extract job application info. Return JSON: { "company": string, "job_title": string, "location": string, "is_job_receipt": boolean }. Set is_job_receipt to false if this is a verification or system email.',
        },
        {
          role: "user",
          content: `Subject: ${emailContent.subject}\n\n${text}`,
        },
      ],
      response_format: { type: "json_object" },
    });

    const aiParsed = JSON.parse(completion.choices[0].message.content);

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
      console.log(`✅ Job Tracked: ${newJob.title} at ${newJob.company}`);

      await notification.create({
        userId: user._id,
        message: `New Application Tracked: ${aiParsed.job_title} at ${aiParsed.company}`,
        type: "job",
      });
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error("Critical Webhook Error:", err);
    return res.status(500).send("Internal Server Error");
  }
};
