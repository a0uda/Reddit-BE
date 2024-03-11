const mongoose = require("mongoose");

const NotificationSchema = new mongoose.Schema({
  created_at: { type: Date, default: Date.now, required: true },
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  post_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Post",
  },
  comment_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Comment",
  },
  sending_user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  description: { type: String, required: true },
  unread_flag: { type: Boolean, default: true },
  hidden_flag: { type: Boolean, default: false },
  type: {
    type: String,
    enum: [
      "message",
      "comment",
      "upvote_post",
      "upvote_comment",
      "reply",
      "new_follower",
      "invitation",
      "post",
    ],
  },
});

module.exports = mongoose.model("Notification", NotificationSchema);
