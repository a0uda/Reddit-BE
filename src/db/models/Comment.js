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

  deleted: {
    type: Boolean,
    default: false,
  },
  description: {
    type: String,
    required: true,
  },
  //flag used to indicate if comment is in community if not then it is in user profile
  //must be the same as its own post
  //and community id and name can be null or don't care
  comment_in_community_flag: {
    type: Boolean,
    default: false,
  },
  community_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Community",
  },
  community_name: {
    type: String,
  },
  //there is nothing as upvotes and downvotes count, it is votes count only
  upvotes_count: { type: Number, default: 0 },
  downvotes_count: { type: Number, default: 0 },
  spam_flag: {
    type: Boolean,
    default: false,
  },
  //no allow replies in comment only lock
  locked_flag: {
    type: Boolean,
    default: false,
  },
  spoiler_flag: { type: Boolean, default: false },
  show_comment_flag: {
    type: Boolean,
    default: true,
  },

  moderator_details: {
    //if in my own profile then Im the moderator
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
    approved_flag: {
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
