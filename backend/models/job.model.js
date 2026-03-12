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

    statusHistory: [
      {
        status: {
          type: String,
          enum: ["applied", "interview", "rejected", "offer"],
          required: true,
        },
        changedAt: { type: Date, default: Date.now },
      },
    ],

    dateApplied: { type: Date, default: Date.now, index: true },

    source: {
      type: String,
      enum: ["manual", "linkedin", "email"],
      default: "manual",
      index: true,
    },

    sourceId: { type: String, default: undefined },

    sourceUrl: { type: String, default: null },
    link: { type: String, default: null },

    archived: { type: Boolean, default: false, index: true },
    starred: { type: Boolean, default: false, index: true },

    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
      index: true,
    },

    tags: { type: [String], default: [], index: true },
    documents: [
      {
        type: {
          type: String,
          enum: ["resume", "cover_letter"],
          fileUrl: { type: String, required: true },
          fileName: { type: String },
          uploadedAt: { type: Date, default: Date.now },
        },
      },
    ],
  },
  { timestamps: true },
);

jobSchema.index({ userId: 1, company: 1 });
jobSchema.index({ userId: 1, title: 1 });

jobSchema.index(
  { userId: 1, source: 1, sourceId: 1 },
  {
    unique: true,
    partialFilterExpression: { sourceId: { $type: "string" } },
  },
);

jobSchema.pre("save", function () {
  if (this.isNew) {
    this.statusHistory = [{ status: this.status, changedAt: new Date() }];
    return;
  }

  if (this.isModified("status")) {
    this.statusHistory.push({ status: this.status, changedAt: new Date() });
  }
});

export default mongoose.model("Job", jobSchema);
