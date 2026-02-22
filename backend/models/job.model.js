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

    source: {
      type: String,
      enum: ["manual", "linkedin", "email"],
      default: "manual",
      index: true,
    },

    // ✅ NEW: for dedupe (Resend inbound email id)
    sourceId: { type: String, default: null },

    sourceUrl: { type: String, default: null },
  },
  { timestamps: true },
);

// Keep your existing indexes
jobSchema.index({ userId: 1, company: 1 });
jobSchema.index({ userId: 1, title: 1 });

// ✅ NEW: DB-level dedupe for inbound emails (prevents duplicates on retries)
jobSchema.index(
  { userId: 1, source: 1, sourceId: 1 },
  { unique: true, sparse: true },
);

const Job = mongoose.model("Job", jobSchema);
export default Job;
