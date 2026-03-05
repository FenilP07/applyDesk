import mongoose from "mongoose";
import Job from "../models/job.model.js";
import JobNote from "../models/jobNote.model.js";

const isOid = (v) => mongoose.Types.ObjectId.isValid(v);

function parseDateOrNull(value) {
  if (value === null || value === undefined || value === "") return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

const createJobNote = async (req, res) => {
  const { jobId } = req.params;
  if (!isOid(jobId)) return res.status(400).json({ message: "Invalid jobId" });

  const text = String(req.body.text || "").trim();
  const pinned = Boolean(req.body.pinned);
  const remindAt = parseDateOrNull(req.body.remindAt);

  const job = await Job.findOne({
    _id: jobId,
    userId: req.user._id,
  }).select("_id");

  if (!job) return res.status(404).json({ message: "Job not found" });

  const note = await JobNote.create({
    jobId,
    userId: req.user._id,
    text,
    pinned,
    remindAt,
    doneAt: null,
    edited: false,
  });

  return res.status(201).json(note);
};
const listJobNotes = async (req, res) => {
  const { jobId } = req.params;
  if (!isOid(jobId)) return res.status(400).json({ message: "Invalid jobId" });
  const page = Math.max(1, parseInt(String(req.query.page || "1"), 10));
  const limit = Math.min(
    100,
    Math.max(1, parseInt(String(req.query.limit || "25"), 10)),
  );
  const skip = (page - 1) * limit;

  const job = await Job.findOne({
    _id: jobId,
    userId: req.user._id,
  }).select("_id");

  if (!job) return res.status(404).json({ message: "Job not found" });

  const [items, total] = await Promise.all([
    JobNote.find({ jobId, userId: req.user._id })
      .sort({ pinned: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    JobNote.countDocuments({ jobId, userId: req.user._id }),
  ]);

  return res.json({
    items,
    page,
    limit,
    total,
    hasMore: skip + items.length < total,
  });
};
const updateJobNote = async (req, res) => {
  const { noteId } = req.params;
  if (!isOid(noteId))
    return res.status(400).json({ message: "Invalid noteId" });

  const updates = {};
  if (req.body.text !== undefined) {
    const text = String(req.body.text || "").trim();
    if (!text)
      return res.status(400).json({ message: "Note text is required" });
    if (text.length > 4000)
      return res
        .status(400)
        .json({ message: "Note too long (max 4000 chars)" });
    updates.text = text;
    updates.edited = true;
  }

  if (req.body.pinned !== undefined) {
    updates.pinned = Boolean(req.body.pinned);
  }

  if (req.body.remindAt !== undefined) {
    updates.remindAt = parseDateOrNull(req.body.remindAt);

    if (updates.remindAt) updates.doneAt = null;
  }
  const note = await JobNote.findOneAndUpdate(
    { _id: noteId, userId: req.user._id },
    { $set: updates },
    { new: true },
  );

  if (!note) return res.status(404).json({ message: "Note not found" });
  return res.json(note);
};

const setJobNoteDone = async (req, res) => {
  const { noteId } = req.params;
  if (!isOid(noteId))
    return res.status(400).json({ message: "Invalid noteId" });

  const done = Boolean(req.body.done);
  const note = await JobNote.findOneAndUpdate(
    { _id: noteId, userId: req.user._id },
    { $set: { doneAt: done ? new Date() : null } },
    { new: true },
  );

  if (!note) return res.status(404).json({ message: "Note not found" });
  return res.json(note);
};

const deleteJobNote = async (req, res) => {
  const { noteId } = req.params;
  if (!isOid(noteId))
    return res.status(400).json({ message: "Invalid noteId" });
  const note = await JobNote.findOneAndDelete({
    _id: noteId,
    userId: req.user._id,
  });

  if (!note) return res.status(404).json({ message: "Note not found" });
  return res.json({ success: true });
};
const listReminders = async (req, res) => {
  const scope = String(req.query.scope || "today");
  const limit = Math.min(
    200,
    Math.max(1, parseInt(String(req.query.limit || "50"), 10)),
  );

  const now = new Date();

  const base = {
    userId: req.user._id,
    doneAt: null,
    remindAt: { $ne: null },
  };

  let query = base;

  if (scope === "overdue") {
    query = { ...base, remindAt: { $lt: now } };
  } else if (scope === "upcoming") {
    const in7 = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    query = { ...base, remindAt: { $gte: now, $lte: in7 } };
  } else {
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    const end = new Date(now);
    end.setHours(23, 59, 59, 999);
    query = { ...base, remindAt: { $gte: start, $lte: end } };
  }

  const notes = await JobNote.find(query)
    .sort({ pinned: -1, remindAt: 1, createdAt: -1 })
    .limit(limit)
    .populate({ path: "jobId", select: "title company status" })
    .lean();

  return res.json({ items: notes, scope, now: now.toISOString() });
};

export {
  createJobNote,
  listJobNotes,
  updateJobNote,
  setJobNoteDone,
  deleteJobNote,
  listReminders,
};
