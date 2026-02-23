import mongoose from "mongoose";
import { app } from "./app.js";
import authRoutes from "./routes/user.route.js";
import jobRoutes from "./routes/job.route.js";
import automationRoutes from "./routes/automation.route.js";

app.get("health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

app.use("/api/auth", authRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/webhook", automationRoutes);

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    app.listen(process.env.PORT || 5000, () => {
      console.log("Server running");
    });
  })
  .catch((err) => {
    console.error("Mongo error:", err.message);
    process.exit(1);
  });
