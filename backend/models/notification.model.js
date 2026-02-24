import mongoose, { Schema } from "mongoose";

const notificationSchema = Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  message: { type: String, required: true },
  link: { type: String },
  type: { type: String, enum: ["system", "job"], default: "system" },
  read: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now, expires: 86400 },
});

const notification = mongoose.model("Notification", notificationSchema);

export default notification;
