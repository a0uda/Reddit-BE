import mongoose from "mongoose";

const commentSchema = new mongoose.Schema({
  //add community id or return community name with comment
  post_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Post",
    required: true,
  },
  post_title: {
    type: String,
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
  //bool is reply if the comment is reply
  is_reply: {
    type: Boolean,
    default: false,
  },
  //id of parent comment if it is reply else null
  parent_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Comment",
    default: null,
  },
  //the username of the person of the parent comment if it is a reply
  parent_username: {
    type: String,
    default: null,
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
  edited_at: {
    type: Date,
    default: null,
  },
  deleted_at: {
    type: Date,
    default: null,
  },

  deleted: {
    type: Boolean,
    default: false,
  },
  description: {
    type: String,
    required: true,
    default: null,
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
    default: null,
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
  //if in my own profile then Im the moderator
  // The edited_at attribute is meaningless if the post is in a community, the edit history is stored in the moderator_details object.
  moderator_details: {
    approved_flag: { type: Boolean, default: false },
    approved_by: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    approved_date: { type: Date, default: null },

    removed_flag: { type: Boolean, default: false },
    removed_by: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    removed_date: { type: Date, default: null },
    removed_removal_reason: { type: String, default: null }, // TODO: add removal reason (optional).

    spammed_flag: { type: Boolean, default: false },
    spammed_by: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    spammed_type: { type: String, default: null },
    spammed_date: { type: Date },
    spammed_removal_reason: { type: String, default: null }, // TODO: add removal reason (optional).

    // TODO: add reported_flag, reported_by, reported_type.
    reported_flag: { type: Boolean, default: false },
    reported_by: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    reported_type: { type: String, default: null },
    reported_date: { type: Date },
  
    edited_at: { type: Date },
  },

  community_moderator_details: {
    unmoderated: {
      approved: {
        flag: { type: Boolean, default: false },
        by: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        date: { type: Date },
      },

      any_action_taken: { type: Boolean, default: false },
    },

    reported: {
      flag: { type: Boolean, default: false },
      by: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      date: { type: Date },
      type: { type: String, default: null },

      confirmed: { type: Boolean, default: false },
    },

    spammed: {
      flag: { type: Boolean, default: false },
      by: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      date: { type: Date },
      type: { type: String, default: null },

      confirmed: { type: Boolean, default: false },
    },

    removed: {
      flag: { type: Boolean, default: false },
      by: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      date: { type: Date, default: null },
      type: { type: String, default: null },

      confirmed: { type: Boolean, default: false },
    },

    edit_history: [
      {
        edited_at: { type: Date, default: null},
        approved_edit_flag: { type: Boolean, default: false },
        removed_edit_flag: { type: Boolean, default: false },
      },
    ],
  },

  upvote_users: [{ type: String }], // Array of usernames who upvoted
  downvote_users: [{ type: String }], // Array of usernames who downvoted
});

commentSchema.pre("find", function () {
  this.where({ deleted: false });
  // // Define the projection based on whether the post is deleted or not
  // const projection = this.getQuery().deleted ? "deleted deleted_at title" : "";

  // // Set the projection to the query
  // this.select(projection);

  // next();
});

export const Comment = mongoose.model("Comment", commentSchema);
