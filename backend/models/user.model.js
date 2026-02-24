import mongoose, { Schema } from "mongoose";

const userSchema = new Schema(
  {
    googleId: { type: String, unique: true, sparse: true, index: true },

    name: { type: String, required: true, trim: true },

    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
    },

    inboundPrefix: {
      type: String,
      unique: true,
      sparse: true,
      default: () => Math.random().toString(36).substring(2, 10),
    },

    picture: { type: String, default: null },

    refreshToken: { type: String, default: null, select: false },

    notifications: {},
  },
  {
    timestamps: true,
  },
);

const user = mongoose.model("User", userSchema);

export default user;
