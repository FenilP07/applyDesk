import Job from "../models/job.model.js";
import { uploadBuffer } from "../utils/uploadToCloudinary.js";
import { deleteResource } from "../utils/deleteFromCloudinary.js";

const VALID_STATUSES = new Set(["applied", "interview", "rejected", "offer"]);
const VALID_PRIORITIES = new Set(["low", "medium", "high"]);

function toDateOrNull(value) {
  if (value === undefined || value === null || value === "") return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function escapeRegex(str = "") {
  return String(str).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normalizeTags(tags) {
  if (!tags) return [];
  const arr = Array.isArray(tags) ? tags : String(tags).split(",");
  return [...new Set(arr.map((t) => String(t).trim()).filter(Boolean))].slice(
    0,
    20,
  );
}

const createJob = async (req, res) => {
  try {
    const {
      title,
      company,
      location,
      status,
      dateApplied,
      source,
      sourceUrl,
      link,
      tags,
      starred,
      priority,
      archived,
    } = req.body;

    if (!title || !company) {
      return res
        .status(400)
        .json({ message: "Title and Company are required" });
    }

    const normalizedStatus = status || "applied";
    if (!VALID_STATUSES.has(normalizedStatus)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const normalizedPriority = priority ?? "medium";
    if (!VALID_PRIORITIES.has(normalizedPriority)) {
      return res.status(400).json({ message: "Invalid priority" });
    }

    const applied = toDateOrNull(dateApplied) || new Date();

    const dupWindowStart = new Date(
      applied.getTime() - 14 * 24 * 60 * 60 * 1000,
    );

    const existing = await Job.findOne({
      userId: req.user._id,
      title: title.trim(),
      company: company.trim(),
      dateApplied: { $gte: dupWindowStart },
    }).select("_id");

    if (existing) {
      return res.status(409).json({
        message: "This job already exists (recent duplicate).",
      });
    }

    const newJob = await Job.create({
      userId: req.user._id,
      title: title.trim(),
      company: company.trim(),
      location: location?.trim() || null,

      status: normalizedStatus,

      dateApplied: applied,
      source: source || "manual",
      sourceUrl: sourceUrl || null,
      link: link || null,

      tags: normalizeTags(tags),
      starred: Boolean(starred),
      priority: normalizedPriority,
      archived: Boolean(archived),
    });

    return res.status(201).json({
      success: true,
      data: newJob,
    });
  } catch (error) {
    console.error("createJob error:", error);
    return res.status(500).json({ message: "Failed to create job" });
  }
};

const getJobs = async (req, res) => {
  try {
    const { status, company, q, archived, starred, tag, priority } = req.query;

    const filter = { userId: req.user._id };

    // archived filter (default: show non-archived)
    if (archived === "true") filter.archived = true;
    else if (archived === "false" || archived === undefined)
      filter.archived = false;

    if (starred === "true") filter.starred = true;
    if (priority && VALID_PRIORITIES.has(String(priority)))
      filter.priority = priority;

    if (status && status !== "all") filter.status = status;

    if (company) {
      filter.company = { $regex: escapeRegex(company), $options: "i" };
    }

    if (tag) {
      filter.tags = String(tag).trim();
    }

    if (q) {
      const safe = escapeRegex(q);
      filter.$or = [
        { title: { $regex: safe, $options: "i" } },
        { company: { $regex: safe, $options: "i" } },
      ];
    }

    const page = Math.max(1, parseInt(String(req.query.page || "1"), 10));
    const limit = Math.min(
      100,
      Math.max(1, parseInt(String(req.query.limit || "50"), 10)),
    );
    const skip = (page - 1) * limit;

    const [jobs, total] = await Promise.all([
      Job.find(filter)
        .sort({ starred: -1, dateApplied: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Job.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      data: jobs,
      meta: { page, limit, total, hasMore: skip + jobs.length < total },
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch jobs" });
  }
};

const updateJob = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const job = await Job.findOne({ _id: id, userId: req.user._id });
    if (!job) return res.status(404).json({ message: "Job not found" });

    const allowedUpdates = [
      "title",
      "company",
      "location",
      "dateApplied",
      "link",
      "sourceUrl",
      "starred",
      "archived",
      "priority",
      "tags",
    ];

    for (const field of allowedUpdates) {
      if (updateData[field] === undefined) continue;

      if (field === "tags") {
        job.tags = normalizeTags(updateData.tags);
        continue;
      }

      if (field === "priority") {
        const p = String(updateData.priority || "medium");
        if (!VALID_PRIORITIES.has(p)) {
          return res.status(400).json({ message: "Invalid priority" });
        }
        job.priority = p;
        continue;
      }

      if (field === "archived" || field === "starred") {
        job[field] = Boolean(updateData[field]);
        continue;
      }

      if (field === "dateApplied") {
        const d = toDateOrNull(updateData.dateApplied);
        if (!d) return res.status(400).json({ message: "Invalid dateApplied" });
        job.dateApplied = d;
        continue;
      }

      job[field] =
        typeof updateData[field] === "string"
          ? updateData[field].trim()
          : updateData[field];
    }

    await job.save();
    return res.status(200).json({ success: true, data: job });
  } catch (error) {
    return res.status(500).json({ message: "Update failed" });
  }
};

const deleteJob = async (req, res) => {
  try {
    const { id } = req.params;

    const deleted = await Job.findOneAndDelete({
      _id: id,
      userId: req.user._id,
    });

    if (!deleted) return res.status(404).json({ message: "Job not found" });

    return res.status(200).json({ success: true });
  } catch (error) {
    return res.status(500).json({ message: "Failed to delete job" });
  }
};

const getJobSummary = async (req, res) => {
  try {
    if (!req.user?._id) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const userId = req.user._id;

    const summary = await Job.aggregate([
      { $match: { userId, archived: false } },
      {
        $group: { _id: "$status", count: { $sum: 1 } },
      },
    ]);

    const byStatus = { applied: 0, interview: 0, rejected: 0, offer: 0 };
    let total = 0;

    for (const row of summary) {
      byStatus[row._id] = row.count;
      total += row.count;
    }

    return res.status(200).json({ success: true, data: { total, byStatus } });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch analytics" });
  }
};

const updateJobStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        message: "Status is required",
      });
    }
    if (!VALID_STATUSES.has(status))
      return res.status(400).json({ message: "Invalid status" });

    const job = await Job.findOne({ _id: id, userId: req.user._id });

    if (!job) {
      return res.status(404).json({
        message: "Job not found",
      });
    }

    job.status = status;
    await job.save();

    return res.status(200).json({
      success: true,
      data: job,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to update job status",
    });
  }
};
const getJobById = async (req, res) => {
  try {
    const { id } = req.params;

    const job = await Job.findOne({
      _id: id,
      userId: req.user._id,
    });

    if (!job) return res.status(404).json({ message: "Job not found" });
    return res.status(200).json({
      success: true,
      data: job,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch job",
    });
  }
};

const getJobTimeline = async (req, res) => {
  try {
    const job = await Job.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    const timeline = [
      {
        type: "created",
        date: job.createdAt,
        label: "Job added",
      },
      ...job.statusHistory.map((s) => ({
        type: "status",
        date: s.changedAt,
        label: `Status changed to ${s.status}`,
      })),
    ].sort((a, b) => new Date(b.date) - new Date(a.date));

    return res.json({ success: true, data: timeline });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch timeline" });
  }
};

const uploadJobDocuments = async (req, res) => {
  try {
    const { id } = req.params;
    const job = await Job.findOne({ _id: id, userId: req.user._id });

    if (!job) return res.status(404).json({ message: "Job not found" });

    const uploadedDocs = [];

    const fileKeys = ["resume", "coverLetter"];

    for (const key of fileKeys) {
      if (req.files[key]) {
        const file = req.files[key][0];

        const result = await uploadBuffer(
          file.buffer,
          `applydesk/${req.user._id}`,
          {
            resource_type: "image",
            filename_override: file.originalname,
          },
        );

        uploadedDocs.push({
          type: key === "resume" ? "resume" : "cover_letter",
          fileUrl: result.secure_url,
          fileName: file.originalname,
          publicId: result.public_id,
        });
      }
    }

    if (uploadedDocs.length === 0) {
      return res.status(400).json({ message: "No files were uploaded." });
    }

    job.documents.push(...uploadedDocs);
    await job.save();

    return res.status(200).json({
      success: true,
      message: "Documents linked successfully",
      data: job.documents,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return res.status(500).json({ message: "Failed to upload documents" });
  }
};

const deleteJobDocuments = async (req, res) => {
  try {
    const { id, docId } = req.params;
    const job = await Job.findOne({ _id: id, userId: req.user._id });
    if (!job) return res.status(404).json({ message: "Job not found" });

    const doc = job.documents.id(docId);
    if (!doc) return res.status(404).json({ message: "Document not found" });

    if (doc.publicId) {
      try {
        await deleteResource(doc.publicId, "image");
      } catch (cloudErr) {
        console.error("Cloudinary cleanup failed:", cloudErr.message);
      }
    }
    doc.deleteOne();
    await job.save();

    return res.status(200).json({
      success: true,
      message: "Document removed",
      data: job.documents,
    });
  } catch (error) {
    console.error("deleteJobDocument error:", error);
    return res.status(500).json({ message: "Server error during deletion" });
  }
};

export {
  createJob,
  deleteJob,
  getJobs,
  updateJob,
  getJobSummary,
  updateJobStatus,
  getJobById,
  getJobTimeline,
  uploadJobDocuments,
  deleteJobDocuments,
};
