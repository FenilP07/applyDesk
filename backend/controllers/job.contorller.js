import Job from "../models/job.model.js";

const createJob = async (req, res) => {
  try {
    const { title, company, location, status, dateApplied, source, sourceUrl } =
      req.body;

    if (!title || !company) {
      return res.status(400).json({
        message: "Title and Company are required",
      });
    }

    const newJob = await Job.create({
      userId: req.user._id,
      title: title.trim(),
      company: company.trim(),
      location: location?.trim() || null,
      status: status || "applied",
      dateApplied: dateApplied ? new Date(dateApplied) : new Date(),
      source: source || "manual",
      sourceUrl: sourceUrl || null,
    });

    return res.status(201).json({
      success: true,
      data: newJob,
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to create job" });
  }
};

const getJobs = async (req, res) => {
  try {
    const { status, company, q } = req.query;
    const filter = { userId: req.user._id };

    if (status && status !== "all") filter.status = status;

    if (company) {
      filter.company = { $regex: company, $options: "i" };
    }

    if (q) {
      filter.$or = [
        { title: { $regex: q, $options: "i" } },
        { company: { $regex: q, $options: "i" } },
      ];
    }

    const jobs = await Job.find(filter).sort({
      dateApplied: -1,
      createdAt: -1,
    });
    return res.status(200).json({ success: true, data: jobs });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch jobs" });
  }
};

const updateJob = async (req, res) => {
  try {
    const { id } = req.params;

    const job = await Job.findOne({ _id: id, userId: req.user._id });
    if (!job) return res.status(404).json({ message: "Job not found" });

    const { title, company, location, status, dateApplied } = req.body;

    if (title !== undefined) job.title = title.trim();
    if (company !== undefined) job.company = company.trim();
    if (location !== undefined) job.location = location?.trim() || null;
    if (status !== undefined) job.status = status;
    if (dateApplied !== undefined) job.dateApplied = new Date(dateApplied);

    await job.save();

    return res.status(200).json({ success: true, data: job });
  } catch (error) {
    return res.status(500).json({ message: "Failed to update job" });
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
      { $match: { userId } },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
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

const updateJobStatus = async () => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).josn({
        message: "Status is required",
      });
    }

    const job = await Job.findOneAndUpdate(
      { _id: id, userId: req.user._id },
      { status },
      { new: true },
    );
    if (!job) {
      return res.status(404).json({
        message: "Job not found",
      });
    }

    return res.status(200).josn({
      success: true,
      data: job,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to update job status",
    });
  }
};

export {
  createJob,
  deleteJob,
  getJobs,
  updateJob,
  getJobSummary,
  updateJobStatus,
};
