import express from "express";
import { isLoggedIn } from "../middlewares/auth.middleware.js";
import {
  createJob,
  getJobs,
  updateJob,
  deleteJob,
  getJobSummary,
  updateJobStatus,
  getJobById,
  getJobTimeline,
} from "../controllers/job.contorller.js";

const router = express.Router();

router.get("/analytics/summary", isLoggedIn, getJobSummary);

router.post("/", isLoggedIn, createJob);
router.get("/", isLoggedIn, getJobs);
router.get("/:id", isLoggedIn, getJobById);

router.get("/:id/timeline", isLoggedIn, getJobTimeline);
router.patch("/:id/status", isLoggedIn, updateJobStatus);
router.patch("/:id", isLoggedIn, updateJob);

router.delete("/:id", isLoggedIn, deleteJob);

export default router;
