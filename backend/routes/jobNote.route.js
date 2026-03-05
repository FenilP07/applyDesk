import express from "express";
import { isLoggedIn } from "../middlewares/auth.middleware.js";
import {
  createJobNote,
  listJobNotes,
  updateJobNote,
  deleteJobNote,
  setJobNoteDone,
  listReminders,
} from "../controllers/jobNote.controller.js";

const router = express.Router();


router.post("/jobs/:jobId/notes", isLoggedIn, createJobNote);
router.get("/jobs/:jobId/notes", isLoggedIn, listJobNotes);


router.patch("/notes/:noteId", isLoggedIn, updateJobNote);
router.delete("/notes/:noteId", isLoggedIn, deleteJobNote);


router.patch("/notes/:noteId/done", isLoggedIn, setJobNoteDone);
router.get("/notes/reminders", isLoggedIn, listReminders);

export default router;
