import mongoose from "mongoose";
import { app } from "./app.js";
import authRoutes from "./routes/user.route.js";
import jobRoutes from "./routes/job.route.js";
import automationRoutes from "./routes/automation.route.js";
import notificationRoutes from "./routes/notification.route.js";
import { initSocket } from "./configs/socket.config.js";
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

app.use("/api/auth", authRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/webhook", automationRoutes);
app.use("/api/notification", notificationRoutes);

const server = initSocket(app);

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    server.listen(process.env.PORT || 5000, () => {
      console.log("Server running");
    });
  })
  .catch((err) => {
    console.error("Mongo error:", err.message);
    process.exit(1);
  });
