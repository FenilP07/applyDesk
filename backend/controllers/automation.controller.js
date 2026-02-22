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

function extractToAddress(emailContent) {
  const to = emailContent?.to;
  if (!to) return null;

  if (typeof to === "string") return extractEmail(to);

  if (Array.isArray(to)) {
    const first = to[0];
    if (!first) return null;

    if (typeof first === "string") return extractEmail(first);

    if (typeof first === "object") {
      return (
        (first.email || extractEmail(first.address || "") || "").trim() || null
      );
    }
  }

  if (typeof to === "object") {
    return (to.email || extractEmail(to.address || "") || "").trim() || null;
  }

  return null;
}

// jobs+<userId>@applydesk.live  -> find user by userId
async function findUserFromInboundRecipient(toAddress) {
  if (!toAddress) return null;

  const lower = toAddress.toLowerCase();
  const localPart = lower.split("@")[0]; // "jobs+xxxx"
  const plus = localPart.split("+")[1]; // "xxxx"

  if (!plus) return null;

  // Mongo ObjectId
  if (/^[a-f0-9]{24}$/.test(plus)) {
    return User.findById(plus);
  }

  // Or you can support email-based plus-addressing if you want
  if (plus.includes("%40")) {
    const decoded = decodeURIComponent(plus);
    return User.findOne({ email: decoded });
  }
  if (plus.includes("@")) {
    return User.findOne({ email: plus });
  }

  return null;
}

const handleResendWebhook = async (req, res) => {
  try {
    const { data, type } = req.body || {};

    // Only handle inbound received emails
    if (type !== "email.received") return res.sendStatus(200);
    if (!data?.email_id) return res.status(400).send("Missing email_id");

    const { data: emailContent, error } = await resend.emails.receiving.get(
      data.email_id,
    );

    if (error || !emailContent) {
      console.error("Resend receiving.get error:", error);
      return res.status(502).send("Failed to fetch inbound email");
    }

    const text =
      emailContent.text?.trim() || stripHtml(emailContent.html || "");

    // ✅ TEMP DEBUG (remove after testing)
    console.log("=== INBOUND EMAIL DEBUG ===");
    console.log("to:", emailContent.to);
    console.log("from:", emailContent.from);
    console.log("subject:", emailContent.subject);
    console.log("text preview:", (text || "").slice(0, 200));
    console.log("===========================");

    // Map email -> user using recipient address
    const toAddress = extractToAddress(emailContent);
    const user = await findUserFromInboundRecipient(toAddress);

    if (!user) {
      console.log("❌ No matching user for recipient:", toAddress);
      return res.status(200).send("No matching user for recipient");
    }

    // ✅ Dedupe using Resend email_id
    const sourceId = data.email_id;

    const existing = await Job.findOne({
      userId: user._id,
      source: "email",
      sourceId,
    });

    if (existing) {
      return res.status(200).json({ success: true, deduped: true });
    }

    // Ask AI to extract job fields
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "Extract job application details from the email. Return strictly valid JSON with keys: company, job_title, location. Use null if unknown.",
        },
        {
          role: "user",
          content: [
            `Subject: ${emailContent.subject || ""}`,
            `From: ${emailContent.from || ""}`,
            "",
            text || "",
          ].join("\n"),
        },
      ],
      response_format: { type: "json_object" },
    });

    const aiParsed = JSON.parse(
      completion.choices?.[0]?.message?.content || "{}",
    );

    const newJob = await Job.create({
      userId: user._id,
      title: aiParsed.job_title || "New Application",
      company: aiParsed.company || "Unknown Company",
      location: aiParsed.location || null,
      status: "applied",
      source: "email",
      sourceId,
      dateApplied: new Date(),
    });

    console.log(
      `✅ Auto-tracked job for ${user.email}: ${newJob.title} at ${newJob.company}`,
    );

    return res.status(200).json({ success: true });
  } catch (err) {
   
    if (err?.code === 11000) {
      return res.status(200).json({ success: true, deduped: true });
    }

    console.error("Automation Webhook Error:", err);
    return res.status(500).send("Internal Webhook Error");
  }
};

export { handleResendWebhook };
