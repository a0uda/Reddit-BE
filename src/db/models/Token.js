import mongoose from "mongoose";

const tokenSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  token: {
    type: String,
    required: true,
  },
  expires_at: {
    type: Date,
    required: true,
    default: () => Date.now() + 3 * 60 * 60 * 1000, // 3 hours in milliseconds
  },
});

export const Token = mongoose.model("Token", tokenSchema);
