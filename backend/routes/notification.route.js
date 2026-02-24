import express from "express";
import notification from "../models/notification.model.js";
import { isLoggedIn } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.get("/", isLoggedIn, async (req, res) => {
  try {
    const notifications = await notification
      .find({
        userId: req.user._id,
      })
      .sort({ createdAt: -1 });
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ message: "Error fetching notifications" });
  }
});

export default router;
