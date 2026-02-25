import mongoose, { Schema } from "mongoose";

const processedEmailSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    emailId: {
      type: String,
      required: true,
      index: true,
    },

    emailHash: {
      type: String,
      index: true,
      default: null,
    },

    from: { type: String, default: null },
    subject: { type: String, default: null },

    aiParsed: {
      type: Schema.Types.Mixed,
      default: null,
    },

    provider: {
      type: String,
      default: null,
    },
  },
  { timestamps: true },
);

processedEmailSchema.index({ userId: 1, emailId: 1 }, { unique: true });

processedEmailSchema.index({ userId: 1, emailHash: 1 });

processedEmailSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: 60 * 60 * 24 * 90 },
);

export default mongoose.model("ProcessedEmail", processedEmailSchema);
