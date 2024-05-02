import mongoose from "mongoose";

const NotificationSchema = new mongoose.Schema({
  created_at: { type: Date, default: Date.now, required: true },
  //saheb el notification
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
  //da el amal el action
  sending_user_username: {
    type: String,
    required: true,
  },
  //community name if post in community to get profile picture and community name
  community_name: {
    type: String,
    default: null,
  },
  unread_flag: { type: Boolean, default: true },
  hidden_flag: { type: Boolean, default: false },
  type: {
    type: String,
    enum: [
      // "post",
      "upvotes_posts",
      "upvotes_comments",
      "comments",
      "replies",
      "new_followers",
      "invitations",
      "private_messages",
      "mentions",
      "chat_messages",
      "chat_requests",
    ],
  },
});

NotificationSchema.pre("find", function () {
  this.where({ hidden_flag: false });
});

export const Notification = mongoose.model("Notification", NotificationSchema);
