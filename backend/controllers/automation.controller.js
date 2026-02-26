import crypto from "crypto";
import { Resend } from "resend";
import OpenAI from "openai";

import Job from "../models/job.model.js";
import User from "../models/user.model.js";
import Notification from "../models/notification.model.js";
import ProcessedEmail from "../models/processedEmail.model.js";
import { getIO } from "../configs/socket.config.js";

const resend = new Resend(process.env.RESEND_API_KEY);
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// =========================
// 1. Enhanced Helpers
// =========================
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

function normalizeText(s = "") {
  return String(s).replace(/\s+/g, " ").trim();
}

function safeLower(s) {
  return (s || "").toLowerCase();
}

function extractEmail(raw = "") {
  return raw.match(/<([^>]+)>/)?.[1]?.trim() || raw.trim();
}

function escapeRegex(str = "") {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function getEmailPrefix(addr = "") {
  return addr.split("@")[0].split("+")[0].trim().toLowerCase();
}

function getDomainFromEmail(email = "") {
  const match = email.toLowerCase().match(/@([^.]+)\./);
  const common = [
    "gmail",
    "outlook",
    "hotmail",
    "yahoo",
    "icloud",
    "googlemail",
  ];
  return match && !common.includes(match[1]) ? match[1] : null;
}

function sha256(input = "") {
  return crypto.createHash("sha256").update(String(input)).digest("hex");
}

function clipText(text, maxChars = 16000) {
  const t = String(text || "");
  if (t.length <= maxChars) return t;
  return t.slice(0, maxChars);
}

function stripNoiseBlocks(raw = "") {
  let t = String(raw || "");
  t = t.replace(/\n-{2,}\s*\n[\s\S]*$/m, "\n");
  t = t.replace(/\n_{2,}\s*\n[\s\S]*$/m, "\n");
  t = t.replace(/\nOn .*wrote:\n[\s\S]*$/m, "\n");
  const noisePatterns = [
    /unsubscribe[\s\S]*$/i,
    /manage your (email )?preferences[\s\S]*$/i,
    /privacy policy[\s\S]*$/i,
    /terms of service[\s\S]*$/i,
    /this message( and any attachments)? is intended only[\s\S]*$/i,
    /confidentiality notice[\s\S]*$/i,
  ];
  for (const p of noisePatterns) t = t.replace(p, "");
  return t.replace(/\n{3,}/g, "\n\n").trim();
}

function cleanCompanyName(company) {
  if (!company) return null;
  let c = normalizeText(company);
  c = c.replace(/\s*(inc\.?|ltd\.?|llc|corp\.?|corporation)\s*$/i, "");
  c = c.replace(
    /[|•·–—-]\s*(careers|jobs|job board|applicants|application).*$/i,
    "",
  );
  return c.trim() || null;
}

function cleanJobTitle(title) {
  if (!title) return null;
  let t = normalizeText(title);
  t = t.replace(/[|•·–—-]\s*(application|applied|candidate|careers).*$/i, "");
  return t.trim() || null;
}

function normalizeUrl(url) {
  if (!url) return null;
  const u = String(url).trim();
  if (!/^https?:\/\//i.test(u)) return null;
  return u;
}

// =========================
// 2. Matching & Parsing
// =========================
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
  return await User.findOne({ inboundPrefix: { $in: prefixes } });
}

function templateParse(subject = "", text = "", from = "") {
  const s = safeLower(subject);
  const t = safeLower(text);
  const combined = `${s}\n${t}`;

  // LinkedIn
  const liMatch = combined.match(
    /your application was sent to\s+([^\.\n\r]+?)(?:\.|\n|$)/i,
  );
  if (liMatch) {
    return {
      is_job_related: true,
      event_type: "application_confirmed",
      next_status: "applied",
      company: cleanCompanyName(liMatch[1]),
      confidence: 0.95,
      provider: "linkedin",
    };
  }

  // Rejections (Generic) - Try to catch "at [Company]"
  if (
    /(regret to inform|not moving forward|unfortunately|we have decided|not proceeding)/i.test(
      combined,
    )
  ) {
    const coMatch = combined.match(
      /(?:at|with|from|interest in)\s+([A-Z][a-z]+(?:\s[A-Z][a-z]+)*)/,
    );
    return {
      is_job_related: true,
      event_type: "rejection",
      next_status: "rejected",
      company: cleanCompanyName(coMatch?.[1]),
      confidence: 0.8,
      provider: "generic",
    };
  }

  return null;
}

async function aiParseEmail({ subject, text, from }) {
  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: `You parse job emails. If the company name is missing from the text, use the sender's email domain (${from}) to infer it. 
        Return JSON: { "is_job_related": boolean, "event_type": "application_confirmed"|"rejection"|"interview"|"offer", "company": string, "job_title": string, "next_status": string, "confidence": number }`,
      },
      {
        role: "user",
        content: `From: ${from}\nSubject: ${subject}\n\n${text}`,
      },
    ],
    response_format: { type: "json_object" },
  });
  const parsed = JSON.parse(completion.choices[0].message.content || "{}");
  return {
    ...parsed,
    company: cleanCompanyName(parsed.company),
    job_title: cleanJobTitle(parsed.job_title),
    job_url: normalizeUrl(parsed.job_url),
  };
}

async function findTargetJob({ userId, company, jobUrl, fromEmail }) {
  if (jobUrl) {
    const byUrl = await Job.findOne({
      userId,
      sourceUrl: normalizeUrl(jobUrl),
    }).sort({ createdAt: -1 });
    if (byUrl) return byUrl;
  }

  const c = cleanCompanyName(company);
  const domain = getDomainFromEmail(fromEmail);

  // 1. Try exact name match
  if (c) {
    const byName = await Job.findOne({
      userId,
      company: new RegExp(`^${escapeRegex(c)}$`, "i"),
    }).sort({ createdAt: -1 });
    if (byName) return byName;
  }

  // 2. Fuzzy Domain Match (Crucial for SaaS reliability)
  if (domain) {
    const byDomain = await Job.findOne({
      userId,
      company: new RegExp(domain, "i"),
    }).sort({ createdAt: -1 });
    if (byDomain) return byDomain;
  }

  return null;
}

// =========================
// 3. Webhook Entry Point
// =========================
export const handleResendWebhook = async (req, res) => {
  try {
    const { data, type } = req.body || {};
    if (type !== "email.received") return res.sendStatus(200);

    const { data: emailContent, error } = await resend.emails.receiving.get(
      data.email_id,
    );
    if (error || !emailContent) return res.status(502).send("Fetch error");

    const user = await findUser(emailContent);
    if (!user) return res.status(200).send("No user match");

    const rawText =
      emailContent.text?.trim() || stripHtml(emailContent.html || "");
    const text = stripNoiseBlocks(rawText);
    const from = extractEmail(emailContent.from || "");
    const subject = emailContent.subject || "";

    // Idempotency check
    const existingLog = await ProcessedEmail.findOne({
      userId: user._id,
      emailId: data.email_id,
    });
    if (existingLog)
      return res.status(200).json({ success: true, message: "Duplicate" });

    // Hash & Cache check
    const emailHash = sha256(clipText(`${subject}\n${text}`, 20000));
    let parsed = templateParse(subject, text, from);

    if (!parsed) {
      const hit = await ProcessedEmail.findOne({
        userId: user._id,
        emailHash,
        aiParsed: { $ne: null },
      });
      if (hit) parsed = hit.aiParsed;
    }

    if (!parsed) {
      parsed = await aiParseEmail({
        subject,
        text: clipText(text, 12000),
        from,
      });
    }

    // Safety Gate
    const isWeakData =
      !parsed.company || parsed.company.toLowerCase().includes("unknown");
    if (!parsed.is_job_related || parsed.confidence < 0.6) {
      await ProcessedEmail.create({
        userId: user._id,
        emailId: data.email_id,
        emailHash,
        from,
        subject,
        aiParsed: parsed,
      });
      return res.status(200).json({ ignored: true });
    }

    // Find and Update
    let job = await findTargetJob({
      userId: user._id,
      company: parsed.company,
      jobUrl: parsed.job_url,
      fromEmail: from,
    });

    if (!job) {
      if (parsed.event_type === "application_confirmed" && !isWeakData) {
        job = await Job.create({
          userId: user._id,
          title: parsed.job_title || "Job Application",
          company: parsed.company,
          status: "applied",
          source: "email",
          sourceId: data.email_id,
          dateApplied: new Date(),
        });
      } else {
        return res.status(200).json({ message: "No match found for update." });
      }
    } else {
      let changed = false;
      if (parsed.next_status && job.status !== parsed.next_status) {
        job.status = parsed.next_status;
        changed = true;
      }
      if (changed) await job.save();
    }

    // Final Log & Socket
    await ProcessedEmail.create({
      userId: user._id,
      emailId: data.email_id,
      emailHash,
      from,
      subject,
      aiParsed: parsed,
    });

    const io = getIO();
    io.to(String(user._id)).emit("new-notification", {
      message: `Update: ${job.company} is now ${job.status}`,
      type: "job",
    });

    return res.status(200).json({ success: true, updated: true });
  } catch (err) {
    console.error("Webhook Error:", err);
    return res.status(500).send("Error");
  }
};
