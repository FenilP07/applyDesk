import mongoose, { Schema } from "mongoose";

const jobNoteSchema = new Schema(
  {
    jobId: {
      type: Schema.Types.ObjectId,
      ref: "Job",
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    text: {
      type: String,
      required: true,
      trim: true,
    },
    pinned: {
      type: Boolean,
      default: false,
      index: true,
    },
    remindAt: {
      type: Date,
      default: null,
      index: true,
    },
    doneAt: { type: Date, default: null, index: true },

    edited: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  },
);

jobNoteSchema.index({ jobId: 1, pinned: -1, createdAt: -1 });
jobNoteSchema.index({ userId: 1, doneAt: 1, remindAt: 1 });

const JobNote = mongoose.model("JobNote", jobNoteSchema);

export default JobNote;
