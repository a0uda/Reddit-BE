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
  polls: [
    {
      options: { type: String },
      votes: { type: Number, default: 0 },
      users_ids: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    },
  ],
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
  // The edited_at attribute is meaningless if the post is in a community, the edit history is stored in the moderator_details object.
  // A moderator can object (report, remove, spam) on an item.
  // When he does the corresponding flag should be sent to true.
  // A moderator could then remove the objection which will reset the flag.
  // Or he could approve the objection which will set the confirmed flag to true

  // Before performing an objection, validation that the other two are false is a must
  //Otherwise a message sayig that objections could not overlap should be returned.

  // When getting the items in a certain queue (reported, removed and spamed)
  // The check is that the flag is true and that the confirmations is false

  // The is visible flag is concerned with the home page which does not display any objected on items

  // When a post is first created it is added by default to the unmoderated queue.
  // The moderator can approve it in the queue, so it will be removed from the queue.
  // the moderator can also remove it from the queue which will be exactly equivaled to the action remove item

  // If a post is edited, the moderator can't object on it until an action is taken in the edit.
  // Notice that we are only concerned with the last edit.
  // action means approve or remove

  // If an item is objected on, it is considered moderated and it is removed from the unmoderated Queue.

  // If an item is objected, the moderator can't edit it until an action is taken on that objection
  moderator_details: {
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
  reposted: {
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
});
// postSchema.pre("find", function (next) {
//   // Define the projection based on whether the post is deleted or not
//   const projection = this.getQuery().deleted ? "deleted deleted_at title" : "";

//   // Set the projection to the query
//   this.select(projection);

//   next();
// });

postSchema.pre("find", function () {
  this.where({ deleted: false });

  const query = this.getQuery();

  // Check if the query is for posts of type "poll" and if it includes the creation date and voting length
  if (query.type == "polls" && query.created_at && query.polls_voting_length) {
    // Calculate the expiration date based on creation date and voting length
    const expirationDate = new Date(query.created_at);
    expirationDate.setDate(
      expirationDate.getDate() + query.polls_voting_length
    );
    // Check if the current date is greater than the expiration date
    const currentDate = new Date();
    if (currentDate > expirationDate) {
      // Update the query to set is_expired_flag to true
      this.update({}, { $set: { polls_voting_is_expired_flag: true } });
    }
  }
});

postSchema.pre("save", function () {
  this.user_details.total_views = this.views_count;
  this.user_details.total_shares = this.shares_count;
  if (this.upvotes_count + this.downvotes_count != 0) {
    this.user_details.upvote_rate =
      (this.upvotes_count / (this.upvotes_count + this.downvotes_count)) * 100;
  }
});

export const Post = mongoose.model("Post", postSchema);
