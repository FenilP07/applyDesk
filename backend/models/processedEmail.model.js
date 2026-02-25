import mongoose, { Schema } from "mongoose";

const processedEmailSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    emailId: { type: String, required: true, index: true },
    from: { type: String, default: null },
    subject: { type: String, default: null },
  },
  { timestamps: true },
);

processedEmailSchema.index({ userId: 1, emailId: 1 }, { unique: true });

export default mongoose.model("ProcessedEmail", processedEmailSchema);
