import express from "express";
import { isLoggedIn } from "../middlewares/auth.middleware.js";
import {
  getNotifications,
  getNotificationsById,
  MarkAsRead,
} from "../controllers/notification.controller.js";

const router = express.Router();

router.get("/", isLoggedIn, getNotifications);
router.get("/:id", isLoggedIn, getNotificationsById);
router.patch("/:id/read", isLoggedIn, MarkAsRead);

export default router;
