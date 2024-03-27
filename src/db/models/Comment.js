import mongoose from "mongoose";

const commentSchema = new mongoose.Schema({
  //add community id or return community name with comment
  post_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Post",
    required: true,
  },
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  username: {
    type: String,
    required: true,
  },
  parent_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Comment",
  },
  replies_comments_ids: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Comment",
    },
  ],
  created_at: {
    type: Date,
    required: false,
    default: Date.now(),
  },
  edited_at: Date,
  deleted_at: Date,
  approved: {
    type: Boolean,
    default: false,
  },
  deleted: {
    type: Boolean,
    default: false,
  },
  description: {
    type: String,
    required: true,
  },
  upvotes_count: {
    type: Number,
    default: 0,
    min: 0,
  },
  downvotes_count: {
    type: Number,
    default: 0,
    min: 0,
  },
  allowreplies_flag: {
    type: Boolean,
    default: true,
  },
  spam_flag: {
    type: Boolean,
    default: false,
  },
  locked_flag: {
    type: Boolean,
    default: false,
  },
  show_comment_flag: {
    type: Boolean,
    default: true,
  },
  moderator_details: {
    approved_by: String,
    approved_date: Date,
    removed_by: String,
    removed_date: Date,
    spammed_by: String,
    spammed_type: String,
    removed_flag: {
      type: Boolean,
      default: false,
    },
    spammed_flag: {
      type: Boolean,
      default: false,
    },
  },
});

export const Comment = mongoose.model("Comment", commentSchema);
