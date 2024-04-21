import mongoose from "mongoose";

export const postSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  username: {
    type: String,
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    default: null,
  },
  created_at: {
    type: Date,
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
  type: {
    type: String,
    enum: ["image_and_videos", "polls", "url", "text", "hybrid", "reposted"],
    default: "text",
  },
  link_url: {
    type: String,
    default: null,
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
  //changed name from poll to polls
  polls: [{ options: { type: String }, votes: { type: Number, default: 0 } }],
  //voting length in days if the type is polls
  polls_voting_length: { type: Number, default: 3 },
  polls_voting_is_expired_flag: { type: Boolean, default: false },
  //flag used to indicate if post is in community if not then it is in user profile
  //and community id and name can be null or don't care
  post_in_community_flag: {
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
  //removed followers users id as already each user has his followed posts
  comments_count: { type: Number, default: 0, min: 0 },
  views_count: { type: Number, default: 0, min: 0 },
  shares_count: { type: Number, default: 0, min: 0 },
  //there is nothing as upvotes and downvotes count, it is votes count only
  upvotes_count: { type: Number, default: 0 },
  downvotes_count: { type: Number, default: 0 },
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
    default: "None (Recommended)",
  },
  scheduled_flag: { type: Boolean, default: false },

  //if in my own profile then Im the moderator
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
    spammed_removal_reason: { type: String, default: null }, // TODO: add removal reason (optional).

    // TODO: add reported_flag, reported_by, reported_type.
    reported_flag: { type: Boolean, default: false },
    reported_by: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    reported_type: { type: String, default: null },
  },

  user_details: {
    total_views: { type: Number, default: 0, min: 0 },
    upvote_rate: { type: Number, default: 0, min: 0 },
    total_shares: { type: Number, default: 0, min: 0 },
  },
  //flag to check if post is reposted or not
  is_reposted_flag: {
    type: Boolean,
    default: false,
  },
  //if true fill in this object
  reposted: [
    {
      //don't need it as user id is the one who reposted
      // shared_by: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      //don't need it as title is the caption
      // caption: { type: String, default: null },
      //shared to-> community name aady
      original_post_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Post",
      },
    },
  ],
});
postSchema.pre("find", function (next) {
  // Define the projection based on whether the post is deleted or not
  const projection = this.getQuery().deleted ? "deleted deleted_at title" : "";

  // Set the projection to the query
  this.select(projection);

  next();
});
export const Post = mongoose.model("Post", postSchema);

// postSchema.pre("find", function () {
//   this.where({ deleted: false });
// });
