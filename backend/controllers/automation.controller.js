import { Resend } from "resend";
import OpenAI from "openai";
import Job from "../models/job.model.js";
import User from "../models/user.model.js";

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

  const headers = emailContent.headers || {};

  const deliveredTo = headers["delivered-to"] || "";
  const xForwardedTo = headers["x-forwarded-to"] || "";

  const searchString =
    `${toAddress} ${deliveredTo} ${xForwardedTo}`.toLowerCase();

  const plusMatch = searchString.match(/\+([a-f0-9]{24})@/);

  if (plusMatch) {
    const userId = plusMatch[1];
    const user = await User.findById(userId);
    if (user) return user;
  }

  const fromEmail = extractEmail(emailContent.from || "");
  const userByFrom = await User.findOne({ email: fromEmail });
  if (userByFrom) return userByFrom;

  return null;
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

    if (emailContent.from?.toLowerCase().includes("google.com")) {
      console.log("=== 🔑 GOOGLE VERIFICATION CODE START ===");
      console.log(text);
      console.log("=== 🔑 GOOGLE VERIFICATION CODE END ===");
    }

    const user = await findUser(emailContent);

    if (!user) {
      console.log(
        `❌ No user found for: ${emailContent.from} -> ${emailContent.to}`,
      );
      return res.status(200).send("Webhook received, but no user matched.");
    }

    const existingJob = await Job.findOne({ sourceId: data.email_id });
    if (existingJob)
      return res
        .status(200)
        .json({ success: true, message: "Already processed" });

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
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error("Critical Webhook Error:", err);
    return res.status(500).send("Internal Server Error");
  }
};
