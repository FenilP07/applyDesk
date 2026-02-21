import express from "express";
import { handleResendWebhook } from "../controllers/automation.controller.js";

const router = express.Router();
router.post("/resend", handleResendWebhook);

export default router;
