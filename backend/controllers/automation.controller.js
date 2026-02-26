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
// Text helpers
// =========================
function stripHtml(html = "") {
  return String(html || "")
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

function safeLower(s = "") {
  return String(s || "").toLowerCase();
}

function extractEmail(raw = "") {
  return raw.match(/<([^>]+)>/)?.[1]?.trim() || String(raw || "").trim();
}

function escapeRegex(str = "") {
  return String(str || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function getEmailPrefix(addr = "") {
  return String(addr || "")
    .split("@")[0]
    .split("+")[0]
    .trim()
    .toLowerCase();
}

function sha256(input = "") {
  return crypto.createHash("sha256").update(String(input)).digest("hex");
}

function clipText(text, maxChars = 16000) {
  const t = String(text || "");
  if (t.length <= maxChars) return t;
  return t.slice(0, maxChars);
}

/**
 * Remove common email footers/signatures, legal, unsubscribe blocks.
 * (Not perfect, but reduces tokens + noise a lot)
 */
function stripNoiseBlocks(raw = "") {
  let t = String(raw || "");

  // Common separators
  t = t.replace(/\n-{2,}\s*\n[\s\S]*$/m, "\n"); // everything after "----"
  t = t.replace(/\n_{2,}\s*\n[\s\S]*$/m, "\n"); // everything after "____"
  t = t.replace(/\nOn .*wrote:\n[\s\S]*$/m, "\n"); // quoted replies

  // Unsubscribe / preferences / legal
  const noisePatterns = [
    /unsubscribe[\s\S]*$/i,
    /manage your (email )?preferences[\s\S]*$/i,
    /privacy policy[\s\S]*$/i,
    /terms of service[\s\S]*$/i,
    /this message( and any attachments)? is intended only[\s\S]*$/i,
    /confidentiality notice[\s\S]*$/i,
  ];

  for (const p of noisePatterns) t = t.replace(p, "");

  // Collapse whitespace
  return t.replace(/\n{3,}/g, "\n\n").trim();
}

function cleanCompanyName(company) {
  if (!company) return null;
  let c = normalizeText(company);

  // remove trailing punctuation/extra words that come from templates
  c = c.replace(/\s*(inc\.?|ltd\.?|llc|corp\.?|corporation)\s*$/i, (m) =>
    m.trim(),
  ); // keep legal suffix but normalize spacing
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

function isValidCompanyName(company) {
  const c = cleanCompanyName(company);
  if (!c) return false;
  if (/^unknown company$/i.test(c.trim())) return false;
  if (c.trim().length < 2) return false;
  return true;
}

function isValidTitle(title) {
  const t = cleanJobTitle(title);
  if (!t) return false;
  if (t.trim().length < 2) return false;
  return true;
}

// =========================
// Status guards (prevent bad AI flips)
// =========================
const STATUS_RANK = { applied: 1, interview: 2, offer: 3, rejected: 4 };

function isForwardMove(current, next) {
  if (!current || !next) return true;
  return (STATUS_RANK[next] || 0) >= (STATUS_RANK[current] || 0);
}

// =========================
// User matching (inbound prefix routing)
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

  const byPrefix =
    prefixes.length > 0
      ? await User.findOne({ inboundPrefix: { $in: prefixes } })
      : null;

  if (byPrefix) return byPrefix;

  // fallback (optional): match by sender == user (not typical for inbound parsing, but keep)
  const fromEmail = extractEmail(emailContent.from || "");
  if (!fromEmail) return null;
  return await User.findOne({ email: fromEmail.toLowerCase() });
}

// =========================
// Job matching
// =========================
async function findTargetJob({ userId, company, jobTitle, jobUrl }) {
  const url = normalizeUrl(jobUrl);

  if (url) {
    const byUrl = await Job.findOne({ userId, sourceUrl: url }).sort({
      createdAt: -1,
    });
    if (byUrl) return byUrl;
  }

  const c = cleanCompanyName(company);
  const jt = cleanJobTitle(jobTitle);

  if (c && jt) {
    const byCompanyTitle = await Job.findOne({
      userId,
      company: new RegExp(`^${escapeRegex(c)}$`, "i"),
      title: new RegExp(escapeRegex(jt), "i"),
    }).sort({ createdAt: -1 });

    if (byCompanyTitle) return byCompanyTitle;
  }

  if (c) {
    const byCompany = await Job.findOne({
      userId,
      company: new RegExp(escapeRegex(c), "i"),
    }).sort({ createdAt: -1 });

    if (byCompany) return byCompany;
  }

  // Fallback for update emails:
  // If we know company but not title, pick most recent open job at that company
  if (c && !jt) {
    const recentOpen = await Job.findOne({
      userId,
      company: new RegExp(escapeRegex(c), "i"),
      status: { $in: ["applied", "interview"] },
    }).sort({ createdAt: -1 });

    if (recentOpen) return recentOpen;
  }

  return null;
}

// =========================
// OpenAI parsing (only parser)
// =========================
async function aiParseEmail({ subject, text }) {
  // hard timeout so webhook never hangs too long
  const controller = new AbortController();
  const timeoutMs = Number(process.env.OPENAI_PARSE_TIMEOUT_MS || 9000);
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const completion = await openai.chat.completions.create(
      {
        model: process.env.OPENAI_PARSE_MODEL || "gpt-4o-mini",
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
- "application_confirmed" means application sent/received.
- "rejection" => next_status rejected
- "interview" => next_status interview
- "offer" => next_status offer
- If not sure => event_type other, next_status null
- confidence is 0..1
- If missing fields, use null.
`,
          },
          { role: "user", content: `Subject: ${subject}\n\n${text}` },
        ],
        response_format: { type: "json_object" },
      },
      { signal: controller.signal },
    );

    const parsed = JSON.parse(completion.choices[0].message.content || "{}");

    return {
      ...parsed,
      company: cleanCompanyName(parsed.company),
      job_title: cleanJobTitle(parsed.job_title),
      job_url: normalizeUrl(parsed.job_url),
      confidence: Number(parsed.confidence ?? 0),
    };
  } finally {
    clearTimeout(timer);
  }
}

// =========================
// Gmail forwarding verification
// =========================
async function handleGmailForwardingIfAny({ user, text, emailContent }) {
  const fromEmail = extractEmail(emailContent.from || "");
  // stricter than includes("google.com") to avoid false positives
  if (!/@google\.com$/i.test(fromEmail)) return false;

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
    return true;
  }

  return false;
}

// =========================
// Cache: reuse prior parse by email hash (saves OpenAI)
// NOTE: ProcessedEmail model should support emailHash + aiParsed fields
// =========================
async function getCachedParse({ userId, emailHash }) {
  if (!emailHash) return null;
  const hit = await ProcessedEmail.findOne({
    userId,
    emailHash,
    aiParsed: { $ne: null },
  }).select("aiParsed");
  return hit?.aiParsed || null;
}

async function cacheParse({ userId, emailHash, parsed }) {
  if (!emailHash || !parsed) return;
  await ProcessedEmail.updateOne(
    { userId, emailHash },
    { $set: { aiParsed: parsed } },
    { upsert: false },
  );
}

// =========================
// Socket emit helper
// =========================
function emitNotification(userId, payload) {
  try {
    const io = getIO();
    io.to(String(userId)).emit("new-notification", payload);
  } catch (e) {
    console.error("Socket emit failed:", e?.message || e);
  }
}

// =========================
// Main webhook (AI-only)
// =========================
export const handleResendWebhook = async (req, res) => {
  try {
    const { data, type } = req.body || {};
    if (type !== "email.received") return res.sendStatus(200);
    if (!data?.email_id) return res.status(400).send("Missing email_id");

    // 1) Fetch email content
    let emailContent;
    if (String(data.email_id).startsWith("test_sim_")) {
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

    // 2) Clean text
    const rawText =
      emailContent.text?.trim() || stripHtml(emailContent.html || "");
    const text = stripNoiseBlocks(rawText);

    // 3) Find user
    const user = await findUser(emailContent);
    if (!user) {
      console.log(
        `No user found for: ${emailContent.from} -> ${emailContent.to}`,
      );
      return res.status(200).send("No user matched.");
    }

    // 4) Gmail forwarding verification
    const handledVerification = await handleGmailForwardingIfAny({
      user,
      text,
      emailContent,
    });
    if (handledVerification) {
      emitNotification(user._id, {
        message: "Action Required: Approve Gmail Forwarding",
        type: "system",
      });
      return res.status(200).send("Verification processed.");
    }

    // 5) Idempotency: by emailId
    const alreadyProcessed = await ProcessedEmail.findOne({
      userId: user._id,
      emailId: data.email_id,
    }).select("_id");

    if (alreadyProcessed) {
      return res
        .status(200)
        .json({ success: true, message: "Duplicate email event" });
    }

    // 6) Create ProcessedEmail record early (locks event)
    const subject = emailContent.subject || "";
    const from = extractEmail(emailContent.from || "");
    const clippedForHash = clipText(`${subject}\n\n${text}`, 20000);
    const emailHash = sha256(clippedForHash);

    try {
      await ProcessedEmail.create({
        userId: user._id,
        emailId: data.email_id,
        emailHash,
        from,
        subject,
      });
    } catch (e) {
      if (e?.code === 11000) {
        return res
          .status(200)
          .json({ success: true, message: "Duplicate email event" });
      }
      throw e;
    }

    // 7) Parse (AI-only) with cache by emailHash
    let parsed = await getCachedParse({ userId: user._id, emailHash });

    if (!parsed) {
      const clipped = clipText(stripNoiseBlocks(text), 16000);
      parsed = await aiParseEmail({ subject, text: clipped });
      await cacheParse({ userId: user._id, emailHash, parsed });
    }

    // Normalize fields again (defensive)
    parsed = {
      ...parsed,
      company: cleanCompanyName(parsed.company),
      job_title: cleanJobTitle(parsed.job_title),
      job_url: normalizeUrl(parsed.job_url),
      confidence: Number(parsed.confidence ?? 0),
    };

    // 8) Confidence gating
    const conf = parsed.confidence;

    // Ignore low confidence / not job related
    if (!parsed.is_job_related || conf < 0.65) {
      return res
        .status(200)
        .json({ success: true, ignored: true, confidence: conf });
    }

    // 9) Try to match an existing job
    let job = await findTargetJob({
      userId: user._id,
      company: parsed.company,
      jobTitle: parsed.job_title,
      jobUrl: parsed.job_url,
    });

    // Create jobs only for confirmed application at higher confidence
    const shouldCreate =
      parsed.event_type === "application_confirmed" && conf >= 0.75;

    // 10) If update-type email but no job matched -> send review flow
    if (!job && !shouldCreate) {
      await ProcessedEmail.updateOne(
        { userId: user._id, emailId: data.email_id },
        {
          $set: {
            needsReview: true,
            reviewReason: "no_matching_job_for_update_event",
            eventType: parsed.event_type,
            snippet: clipText(text, 400),
            aiParsed: parsed,
          },
        },
        { upsert: false },
      );

      await Notification.create({
        userId: user._id,
        type: "system",
        message: `Action needed: We detected a ${parsed.event_type} email but couldn't match it to an existing job.`,
        link: `/inbox/review?emailId=${encodeURIComponent(data.email_id)}`,
      });

      emitNotification(user._id, {
        type: "system",
        message: `Action needed: Match this ${parsed.event_type} email to a job.`,
        link: `/inbox/review?emailId=${data.email_id}`,
      });

      return res.status(200).json({
        success: true,
        ignored: true,
        reason: "no_matching_job_for_update_event",
        event_type: parsed.event_type,
      });
    }

    // 11) Create job
    if (!job && shouldCreate) {
      const okCompany = isValidCompanyName(parsed.company);
      const okTitle = isValidTitle(parsed.job_title);

      // If both missing -> review
      if (!okCompany && !okTitle) {
        await ProcessedEmail.updateOne(
          { userId: user._id, emailId: data.email_id },
          {
            $set: {
              needsReview: true,
              reviewReason: "missing_company_and_title_on_create",
              eventType: parsed.event_type,
              snippet: clipText(text, 400),
              aiParsed: parsed,
            },
          },
          { upsert: false },
        );

        await Notification.create({
          userId: user._id,
          type: "system",
          message:
            "Action needed: We detected a job application email but couldn't confidently extract the company/title.",
          link: `/inbox/review?emailId=${encodeURIComponent(data.email_id)}`,
        });

        emitNotification(user._id, {
          type: "system",
          message:
            "Action needed: We detected an application email but need your help matching it.",
          link: `/inbox/review?emailId=${data.email_id}`,
        });

        return res.status(200).json({
          success: true,
          ignored: true,
          reason: "missing_company_and_title_on_create",
        });
      }

      const newJob = await Job.create({
        userId: user._id,
        title: parsed.job_title || "Job Application",
        company: okCompany ? parsed.company : null,
        location: parsed.location || null,
        status: parsed.next_status || "applied",
        source: "email",
        sourceId: data.email_id,
        sourceUrl: parsed.job_url || null,
        dateApplied: new Date(),
      });

      await Notification.create({
        userId: user._id,
        message: `New Application Tracked: ${newJob.title}${
          newJob.company ? ` at ${newJob.company}` : ""
        }`,
        type: "job",
      });

      emitNotification(user._id, {
        message: `New Application Tracked: ${newJob.title}${
          newJob.company ? ` at ${newJob.company}` : ""
        }`,
        type: "job",
      });

      console.log(
        `Job Created: ${newJob.title} at ${newJob.company || "NO_COMPANY"}`,
      );
      return res.status(200).json({ success: true, created: true });
    }

    // 12) Update existing job (safe status transitions)
    let changed = false;

    if (!job.location && parsed.location) {
      job.location = parsed.location;
      changed = true;
    }
    if (!job.sourceUrl && parsed.job_url) {
      job.sourceUrl = parsed.job_url;
      changed = true;
    }

    // Only apply status updates at stronger confidence
    if (
      parsed.next_status &&
      conf >= 0.7 &&
      job.status !== parsed.next_status
    ) {
      if (isForwardMove(job.status, parsed.next_status)) {
        job.status = parsed.next_status;
        changed = true;
      } else {
        // Status regression guard -> review, don't auto-change
        await ProcessedEmail.updateOne(
          { userId: user._id, emailId: data.email_id },
          {
            $set: {
              needsReview: true,
              reviewReason: "status_regression_guard",
              eventType: parsed.event_type,
              snippet: clipText(text, 400),
              aiParsed: parsed,
            },
          },
          { upsert: false },
        );

        await Notification.create({
          userId: user._id,
          type: "system",
          message:
            "Action needed: We detected a status update, but it looks like it would move your job backwards. Please review.",
          link: `/inbox/review?emailId=${encodeURIComponent(data.email_id)}`,
        });

        emitNotification(user._id, {
          type: "system",
          message:
            "Action needed: Review this email before we update the job status.",
          link: `/inbox/review?emailId=${data.email_id}`,
        });
      }
    }

    if (changed) await job.save();

    if (changed) {
      await Notification.create({
        userId: user._id,
        message: `Update: ${parsed.event_type} for ${job.title} at ${job.company}`,
        type: "job",
      });

      emitNotification(user._id, {
        message: `Update: ${parsed.event_type} for ${job.title} at ${job.company}`,
        type: "job",
      });
    }

    console.log(
      `Job Processed: ${job.title} at ${job.company} | status: ${job.status} | changed: ${changed}`,
    );

    return res.status(200).json({ success: true, updated: true, changed });
  } catch (err) {
    console.error("Critical Webhook Error:", err);
    return res.status(500).send("Internal Server Error");
  }
};
