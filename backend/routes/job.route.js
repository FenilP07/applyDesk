import express from "express";
import { isLoggedIn } from "../middlewares/auth.middleware.js";
import {
  createJob,
  getJobs,
  updateJob,
  deleteJob,
  getJobSummary,
  updateJobStatus,
} from "../controllers/job.contorller.js";

const router = express.Router();

router.get("/analytics/summary", isLoggedIn, getJobSummary);

router.post("/", isLoggedIn, createJob);
router.get("/", isLoggedIn, getJobs);
router.put("/:id", isLoggedIn, updateJob);
router.delete("/:id", isLoggedIn, deleteJob);
router.patch("/:id/status", isLoggedIn, updateJobStatus);

export default router;
