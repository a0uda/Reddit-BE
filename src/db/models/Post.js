import mongoose from "mongoose";

export const postSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  created_at: {
    type: Date,
    default: Date.now(),
  },
  edited_at: {
    type: Date,
  },
  deleted_at: {
    type: Date,
  },
  deleted: {
    type: Boolean,
    default: false,
  },

  type: {
    type: String,
    enum: ["image_and_videos", "polls", "url", "text", "hybrid"],
    default: "text",
  },
  link_url: {
    type: String,
  },
  images: [
    {
      path: { type: String },
      caption: { type: String },
      link: { type: String },
    },
  ],
  videos: [
    {
      path: { type: String },
      caption: { type: String },
      link: { type: String },
    },
  ],
  poll: [{ options: { type: String }, votes: { type: Number, default: 0 } }],
  community_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Community",
  },
  community_name: {
    type: String,
  },
  followers_ids: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  comments_count: { type: Number, default: 0, min: 0 },
  views_count: { type: Number, default: 0, min: 0 },
  shares_count: { type: Number, default: 0, min: 0 },
  //there is nothing as upvotes and downvotes count, it is votes count only
  votes_count: { type: Number, default: 0 },
  oc_flag: { type: Boolean, default: false },
  spoiler_flag: { type: Boolean, default: false },
  nsfw_flag: { type: Boolean, default: false },
  locked_flag: { type: Boolean, default: false },
  allowreplies_flag: { type: Boolean, default: true },
  set_suggested_sort: {
    type: String,
    enum: [
      "None (Recommended)",
      "Best",
      "Old",
      "Top",
      "Q&A",
      "Live (Beta)",
      "Controversial",
      "New",
    ],
  },
  scheduled_flag: { type: Boolean, default: false },
  moderator_details: {
    //if in my own profile then Im the moderator
    approved_by: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    approved_date: { type: Date },
    removed_by: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    removed_date: { type: Date },
    spammed_by: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    spammed_type: { type: String },
    removed_flag: { type: Boolean, default: false },
    spammed_flag: { type: Boolean, default: false },
    approved_flag: {
      type: Boolean,
      default: false,
    },
  },
  user_details: {
    total_views: { type: Number, default: 0, min: 0 },
    upvote_rate: { type: Number, default: 0, min: 0 },
    total_shares: { type: Number, default: 0, min: 0 },
  },
  reposted: [
    {
      shared_by: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      title: { type: String },
    },
  ],
});
export const Post = mongoose.model("Post", postSchema);
