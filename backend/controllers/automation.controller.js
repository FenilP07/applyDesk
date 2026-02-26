
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
// Provider template parsing
// =========================
function templateParse(subject = "", text = "", from = "") {
  const s = safeLower(subject);
  const t = safeLower(text);
  const f = safeLower(from);
  const combined = `${s}\n${t}`;

  // ---- LinkedIn: "Your application was sent to X"
  const liReceipt = combined.match(
    /your application was sent to\s+([^\.\n\r]+?)(?:\.|\n|$)/i,
  );
  if (liReceipt) {
    const company = cleanCompanyName(liReceipt[1]?.trim());
    return {
      is_job_related: true,
      event_type: "application_confirmed",
      next_status: "applied",
      company: company || null,
      job_title: null,
      location: null,
      job_url: null,
      confidence: 0.95,
      provider: "linkedin",
    };
  }

  // ---- Generic extraction: "interest in the <Role> position at <Company>"
  // (works for many ATS + rejection/interview/offer emails)
  const interestMatch = combined.match(
    /interest in (?:the )?(.+?) position at (.+?)(?:\.|\n|$)/i,
  );
  if (interestMatch) {
    const title = cleanJobTitle(interestMatch[1]);
    const company = cleanCompanyName(interestMatch[2]);

    const isReject =
      /(not moving forward|regret to inform|unfortunately|declined|we will not be proceeding)/i.test(
        combined,
      );
    const isInterview =
      /(interview|phone screen|schedule|availability|calendar invite|video interview)/i.test(
        combined,
      );
    const isOffer =
      /(employment offer|offer|compensation|salary|congratulations)/i.test(
        combined,
      );

    let event_type = "other";
    let next_status = null;
    let confidence = 0.78;

    if (isReject) {
      event_type = "rejection";
      next_status = "rejected";
      confidence = 0.9;
    } else if (isInterview) {
      event_type = "interview";
      next_status = "interview";
      confidence = 0.85;
    } else if (isOffer) {
      event_type = "offer";
      next_status = "offer";
      confidence = 0.85;
    }

    return {
      is_job_related: true,
      event_type,
      next_status,
      company: company || null,
      job_title: title || null,
      location: null,
      job_url: null,
      confidence,
      provider: "generic_position_at_company",
    };
  }

  // ---- Greenhouse-ish
  // Subjects often: "Your application to <Company> for <Role>" or "<Company> - Application Received"
  const gh1 = subject.match(/your application to\s+(.+?)\s+for\s+(.+)/i);
  if (gh1) {
    return {
      is_job_related: true,
      event_type: "application_confirmed",
      next_status: "applied",
      company: cleanCompanyName(gh1[1]),
      job_title: cleanJobTitle(gh1[2]),
      location: null,
      job_url: null,
      confidence: 0.9,
      provider: "greenhouse",
    };
  }

  if (/greenhouse\.io/i.test(combined) || /@greenhouse\.io/i.test(f)) {
    // interview / rejection / offer signals still useful
    if (
      /(interview|phone screen|schedule|availability|calendar invite)/i.test(
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
        confidence: 0.78,
        provider: "greenhouse",
      };
    }
  }

  // ---- Lever
  // Often includes "Thanks for applying to <Company>" or "Your application to <Company>"
  const leverThanks = combined.match(
    /thanks for applying to\s+([^\n\r]+?)(?:\.|\n|$)/i,
  );
  if (leverThanks) {
    return {
      is_job_related: true,
      event_type: "application_confirmed",
      next_status: "applied",
      company: cleanCompanyName(leverThanks[1]),
      job_title: null,
      location: null,
      job_url: null,
      confidence: 0.88,
      provider: "lever",
    };
  }

  // ---- Workday-ish (very variable)
  if (/workday/i.test(combined)) {
    if (
      /(application received|thank you for applying|we received your application)/i.test(
        combined,
      )
    ) {
      return {
        is_job_related: true,
        event_type: "application_confirmed",
        next_status: "applied",
        company: null,
        job_title: null,
        location: null,
        job_url: null,
        confidence: 0.72,
        provider: "workday",
      };
    }
  }

  // ---- Generic rejections / interviews / offers (cheap + fast)
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
      provider: "generic",
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
      provider: "generic",
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
      provider: "generic",
    };
  }

  return null;
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

  //  Fallback for update emails:
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
// OpenAI parsing (fallback)
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
- LinkedIn "Your application was sent to" => is_job_related true, event_type application_confirmed, next_status applied.
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
// Main webhook
// =========================
export const handleResendWebhook = async (req, res) => {
  try {
    const { data, type } = req.body || {};
    if (type !== "email.received") return res.sendStatus(200);
    if (!data?.email_id) return res.status(400).send("Missing email_id");

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

    const rawText =
      emailContent.text?.trim() || stripHtml(emailContent.html || "");
    const text = stripNoiseBlocks(rawText);

    const user = await findUser(emailContent);
    if (!user) {
      console.log(
        ` No user found for: ${emailContent.from} -> ${emailContent.to}`,
      );
      return res.status(200).send("No user matched.");
    }

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

    const alreadyProcessed = await ProcessedEmail.findOne({
      userId: user._id,
      emailId: data.email_id,
    }).select("_id");

    if (alreadyProcessed) {
      return res
        .status(200)
        .json({ success: true, message: "Duplicate email event" });
    }

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

    let parsed = templateParse(subject, text, from);

    if (!parsed) {
      const cached = await getCachedParse({ userId: user._id, emailHash });
      if (cached) parsed = cached;
    }

    if (!parsed) {
      const clipped = clipText(stripNoiseBlocks(text), 16000);
      parsed = await aiParseEmail({ subject, text: clipped });
      await cacheParse({ userId: user._id, emailHash, parsed });
    }

    const conf = Number(parsed?.confidence ?? 0);
    if (!parsed?.is_job_related || conf < 0.6) {
      return res
        .status(200)
        .json({ success: true, ignored: true, confidence: conf });
    }

    parsed.company = cleanCompanyName(parsed.company);
    parsed.job_title = cleanJobTitle(parsed.job_title);
    parsed.job_url = normalizeUrl(parsed.job_url);

    let job = await findTargetJob({
      userId: user._id,
      company: parsed.company,
      jobTitle: parsed.job_title,
      jobUrl: parsed.job_url,
    });

    const shouldCreate = parsed.event_type === "application_confirmed";

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

    if (!job && shouldCreate) {
      const okCompany = isValidCompanyName(parsed.company);
      const okTitle = isValidTitle(parsed.job_title);

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

    let changed = false;

    if (!job.location && parsed.location) {
      job.location = parsed.location;
      changed = true;
    }
    if (!job.sourceUrl && parsed.job_url) {
      job.sourceUrl = parsed.job_url;
      changed = true;
    }

    if (parsed.next_status && job.status !== parsed.next_status) {
      job.status = parsed.next_status;
      changed = true;
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
