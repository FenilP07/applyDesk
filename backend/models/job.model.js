import mongoose, { Schema } from "mongoose";

const jobSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: { type: String, required: true, trim: true },
    company: { type: String, required: true, trim: true },
    location: { type: String, default: null, trim: true },
    status: {
      type: String,
      enum: ["applied", "interview", "rejected", "offer"],
      default: "applied",
      index: true,
    },
    dateApplied: { type: Date, default: Date.now, index: true },

    source: { type: String, enum: ["manual", "linkedin"], default: "manual" },
    sourceUrl: { type: String, default: null },
  },
  {
    timestamps: true,
  },
);
jobSchema.index({ userId: 1, company: 1 });
jobSchema.index({ userId: 1, title: 1 });

const job = mongoose.model("Job", jobSchema);

export default job;
