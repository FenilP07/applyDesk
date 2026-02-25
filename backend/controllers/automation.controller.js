import { Resend } from "resend";
import OpenAI from "openai";
import Job from "../models/job.model.js";
import User from "../models/user.model.js";
import Notification from "../models/notification.model.js";
import ProcessedEmail from "../models/processedEmail.model.js";

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

function escapeRegex(str = "") {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normalizeText(s = "") {
  return String(s).replace(/\s+/g, " ").trim();
}

function getEmailPrefix(addr = "") {
  return addr.split("@")[0].split("+")[0].trim().toLowerCase();
}

function safeLower(s) {
  return (s || "").toLowerCase();
}

async function findUser(emailContent) {
  const toRaw = Array.isArray(emailContent.to)
    ? emailContent.to[0]
    : emailContent.to;
  const toAddress = (typeof toRaw === "object" ? toRaw.email : toRaw) || "";
  const deliveredTo = emailContent.headers?.["delivered-to"] || "";

  const prefixes = [
    getEmailPrefix(toAddress),
    getEmailPrefix(deliveredTo),
  ].filter(Boolean);

  const byPrefix =
    prefixes.length > 0
      ? await User.findOne({ inboundPrefix: { $in: prefixes } })
      : null;

  if (byPrefix) return byPrefix;

  const fromEmail = extractEmail(emailContent.from || "");
  if (!fromEmail) return null;

  return await User.findOne({ email: fromEmail.toLowerCase() });
}

function templateParse(subject = "", text = "") {
  const s = safeLower(subject);
  const t = safeLower(text);
  const combined = `${s}\n${t}`;

  const liReceipt = combined.match(
    /your application was sent to\s+([^\.\n\r]+?)(?:\.|\n|$)/i,
  );
  if (liReceipt) {
    const company = liReceipt[1]?.trim();
    return {
      is_job_related: true,
      event_type: "application_confirmed",
      next_status: "applied",
      company: company || null,
      job_title: null,
      location: null,
      job_url: null,
      confidence: 0.95,
    };
  }

  if (
    /(regret to inform|not moving forward|unfortunately|we have decided|we will not be proceeding|declined)/i.test(
      combined,
    )
  ) {
    return {
      is_job_related: true,
      event_type: "rejection",
      next_status: "rejected",
      company: null,
      job_title: null,
      location: null,
      job_url: null,
      confidence: 0.85,
    };
  }

  if (
    /(interview|schedule a call|availability|calendar invite|phone screen|video interview)/i.test(
      combined,
    )
  ) {
    return {
      is_job_related: true,
      event_type: "interview",
      next_status: "interview",
      company: null,
      job_title: null,
      location: null,
      job_url: null,
      confidence: 0.75,
    };
  }

  if (
    /(offer|compensation|salary|contract|employment offer|congratulations)/i.test(
      combined,
    )
  ) {
    return {
      is_job_related: true,
      event_type: "offer",
      next_status: "offer",
      company: null,
      job_title: null,
      location: null,
      job_url: null,
      confidence: 0.75,
    };
  }

  return null;
}

async function findTargetJob({ userId, company, jobTitle, jobUrl }) {
  if (jobUrl) {
    const byUrl = await Job.findOne({ userId, sourceUrl: jobUrl }).sort({
      createdAt: -1,
    });
    if (byUrl) return byUrl;
  }

  if (company && jobTitle) {
    const byCompanyTitle = await Job.findOne({
      userId,
      company: new RegExp(`^${escapeRegex(company)}$`, "i"),
      title: new RegExp(escapeRegex(jobTitle), "i"),
    }).sort({ createdAt: -1 });

    if (byCompanyTitle) return byCompanyTitle;
  }

  if (company) {
    const byCompany = await Job.findOne({
      userId,
      company: new RegExp(escapeRegex(company), "i"),
    }).sort({ createdAt: -1 });

    if (byCompany) return byCompany;
  }

  return null;
}

async function aiParseEmail({ subject, text }) {
  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: `
You parse job-related emails.

Return JSON:
{
  "is_job_related": boolean,
  "event_type": "application_confirmed"|"interview"|"offer"|"rejection"|"other",
  "company": string|null,
  "job_title": string|null,
  "location": string|null,
  "next_status": "applied"|"interview"|"offer"|"rejected"|null,
  "job_url": string|null,
  "confidence": number
}

Rules:
- "application_confirmed" means application sent/received. LinkedIn "Your application was sent to" => is_job_related true, event_type application_confirmed, next_status applied.
- "rejection" => next_status rejected
- "interview" => next_status interview
- "offer" => next_status offer
- If not sure => event_type other, next_status null
- confidence is 0..1
- If missing fields, use null.
`,
      },
      {
        role: "user",
        content: `Subject: ${subject}\n\n${text}`,
      },
    ],
    response_format: { type: "json_object" },
  });

  return JSON.parse(completion.choices[0].message.content);
}

async function handleGmailForwardingIfAny({ user, text, emailContent }) {
  if (!safeLower(emailContent.from).includes("google.com")) return false;

  const cleanText = normalizeText(text);
  const linkMatch = cleanText.match(
    /https:\/\/mail(?:-settings)?\.google\.com\/mail\/v[fu]-[^\s>"]+/i,
  );

  if (linkMatch) {
    await Notification.create({
      userId: user._id,
      message: "Action Required: Approve Gmail Forwarding",
      link: linkMatch[0],
      type: "system",
    });
  }

  return true;
}

export const handleResendWebhook = async (req, res) => {
  try {
    const { data, type } = req.body || {};
    if (type !== "email.received") return res.sendStatus(200);
    if (!data?.email_id) return res.status(400).send("Missing email_id");

    // ── Fetch email content
    let emailContent;
    if (data.email_id.startsWith("test_sim_")) {
      emailContent = {
        subject: "Fenil, your application was sent to Apptoza Inc.",
        text: "Fenil Patel. Your application was sent to Apptoza Inc. Frontend Developer at Apptoza Inc. Applied on February 24, 2026.",
        from: "jobs-noreply@linkedin.com",
        to: data.test_email || "test@applydesk.live",
        headers: {},
      };
    } else {
      const { data: fetched, error } = await resend.emails.receiving.get(
        data.email_id,
      );
      if (error || !fetched) {
        console.error("Resend fetch error:", error);
        return res.status(502).send("Failed to fetch email content");
      }
      emailContent = fetched;
    }

    const text =
      emailContent.text?.trim() || stripHtml(emailContent.html || "");

    // ── Find user
    const user = await findUser(emailContent);
    if (!user) {
      console.log(
        `❌ No user found for: ${emailContent.from} -> ${emailContent.to}`,
      );
      return res.status(200).send("No user matched.");
    }

    // ── Gmail forwarding verification
    const handledVerification = await handleGmailForwardingIfAny({
      user,
      text,
      emailContent,
    });
    if (handledVerification)
      return res.status(200).send("Verification processed.");

    // ── Dedupe by email_id (recommended)
    // If you don't want the extra model, remove this block and keep your old Job.findOne(sourceId)
    const alreadyProcessed = await ProcessedEmail.findOne({
      userId: user._id,
      emailId: data.email_id,
    });

    if (alreadyProcessed) {
      return res
        .status(200)
        .json({ success: true, message: "Duplicate email event" });
    }

    // ── Parse (template first, AI fallback)
    let parsed = templateParse(emailContent.subject || "", text);
    if (!parsed)
      parsed = await aiParseEmail({
        subject: emailContent.subject || "",
        text,
      });

    // ── Mark processed early (idempotency)
    // (If something fails below, you can move this to after updates; but then retries might duplicate.)
    await ProcessedEmail.create({
      userId: user._id,
      emailId: data.email_id,
      from: extractEmail(emailContent.from || ""),
      subject: emailContent.subject || "",
    });

    if (!parsed?.is_job_related || (parsed.confidence ?? 0) < 0.6) {
      return res.status(200).json({ success: true, ignored: true });
    }

    // ── Find target job
    let job = await findTargetJob({
      userId: user._id,
      company: parsed.company,
      jobTitle: parsed.job_title,
      jobUrl: parsed.job_url,
    });

    // ── Decide whether to create if no match
    const shouldCreate =
      parsed.event_type === "application_confirmed" ||
      ["interview", "offer", "rejection"].includes(parsed.event_type);

    if (!job && !shouldCreate) {
      return res
        .status(200)
        .json({ success: true, message: "No matching job to update." });
    }

    // ── Create job
    if (!job) {
      const newJob = await Job.create({
        userId: user._id,
        title: parsed.job_title || "Job Applicant",
        company: parsed.company || "Unknown Company",
        location: parsed.location || null,
        status: parsed.next_status || "applied",
        source: "email",
        sourceId: data.email_id, // ok: unique per job
        sourceUrl: parsed.job_url || null,
        dateApplied: new Date(),
      });

      await Notification.create({
        userId: user._id,
        message: `New Application Tracked: ${newJob.title} at ${newJob.company}`,
        type: "job",
      });

      console.log(`✅ Job Created: ${newJob.title} at ${newJob.company}`);
      return res.status(200).json({ success: true, created: true });
    }

    // ── Update job (use save() so statusHistory hook runs)
    let changed = false;

    // Fill missing fields
    if (!job.location && parsed.location) {
      job.location = parsed.location;
      changed = true;
    }
    if (!job.sourceUrl && parsed.job_url) {
      job.sourceUrl = parsed.job_url;
      changed = true;
    }

    // Status update
    if (parsed.next_status && job.status !== parsed.next_status) {
      job.status = parsed.next_status;
      changed = true;
    }

    if (changed) await job.save();

    await Notification.create({
      userId: user._id,
      message: `Update: ${parsed.event_type} for ${job.title} at ${job.company}`,
      type: "job",
    });

    console.log(
      `✅ Job Updated: ${job.title} at ${job.company} | status: ${job.status} | changed: ${changed}`,
    );

    return res.status(200).json({ success: true, updated: true, changed });
  } catch (err) {
    console.error("Critical Webhook Error:", err);
    return res.status(500).send("Internal Server Error");
  }
};
