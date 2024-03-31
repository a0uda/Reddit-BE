import mongoose from "mongoose";

const communitySchema = new mongoose.Schema({
  created_at: {
    type: Date,
    required: true,
    default: Date.now(),
  },
  name: {
    type: String,
    required: true,
    unique: true,
  },
  title: {
    type: String,
  },
  type: {
    type: String,
    enum: ["public", "private", "restricted"],
  },
  category: {
    type: String,
    enum: [
      // "Technology",
      // "Science",
      "Music",
      // "Sports",
      // "Gaming",
      // "News",
      // "Movies",
      // "Books",
      // "Fashion",
      // "Food",
      // "Travel",
      // "Health",
      "Art",
      // "Photography",
      // "Education",
      // "Business",
      // "Finance",
      // "Politics",
      // "Religion",
      // "DIY",
      // "Pets",
      // "Environment",
      // "Humor",
      "Personal",
    ],
    default: "Personal",
  },
  nsfw_flag: {
    type: Boolean,
    default: false,
  },
  members_count: {
    type: Number,
    min: 0,
    default: 0,
  },
  posts: {
    type: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "DiscussionItemMinimal",
      },
    ],
    default: [],
  },
  comments: {
    type: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "DiscussionItemMinimal",
      },
    ],
    default: [],
  },
  // TODO: There are constraints related to the number of characters and the number of words in some of the fields in the following subdocuments. Am I supposed to do them or will the frontend handle them?
  // TODO: Eng Loay said that we aren't expected to cover the advanced settings in any of these subdocuments.
  general_settings: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "CommunityGeneralSettings",
  },
  content_controls: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "CommunityContentControls",
  },
  posts_and_comments: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "CommunityPostsAndComments",
  },

  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  profile_picture: {
    type: String,
    default: "",
  },
  banner_picture: {
    type: String,
    default: "",
  },
  members_nickname: {
    type: String,
    default: "Members",
  },
  currently_viewing_nickname: {
    type: String,
    default: "Online",
  },
  traffic: String,
  topics: String,
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  views_count: {
    type: Number,
    min: 0,
    default: 0,
  },
  moderators: [{
    _id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    moderator_since: {
      type: Date,
      default: Date.now
    }
  }],
  invited_moderators: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],
  approved_users: [
    {
      id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      approved_at: {
        type: Date,
        default: Date.now,
      },
    },
  ],
  muted_users: [
    {
      id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      muted_by_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      mute_date: Date,
      mute_reason: String,
    },
  ],
  banned_users: [
    {
      id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      username: {
        type: mongoose.Schema.Types.String,
        ref: "User",
      },
      banned_date: Date,
      reason_for_ban: {
        type: String,
        enum: ["none", "rule", "spam", "personal", "threat", "others"],
      },
      mod_note: {
        type: String,
      },
      permanent_flag: {
        type: Boolean,
        default: true,
      },
      banned_until: Date,
      note_for_ban_message: {
        type: String,
      },
    },
  ],
  removed_posts_ids: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post",
    },
  ],
  removed_comments_ids: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Comment",
    },
  ],
  edited_posts_ids: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post",
    },
  ],
  edited_comments_ids: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Comment",
    },
  ],
  unmoderated_posts_ids: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post",
    },
  ],
  unmoderated_comments_ids: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Comment",
    },
  ],
  reported_posts_ids: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post",
    },
  ],
  reported_comments_ids: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Comment",
    },
  ],
  scheduled_posts: [
    {
      post_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Post",
      },
      submit_date: Date,
      submitted_flag: {
        type: Boolean,
        default: false,
      },
      submit_time: {
        type: Date,
      },
      time_zone: {
        type: Date,
      },
      title: String,
      repeat_options: {
        type: String,
        enum: [
          "does_not_repeat",
          "hourly",
          "daily",
          "weekly_on_day",
          "monthly_on_date",
        ],
      },
      repeat_every: {
        number: Number,
        duration: {
          type: String,
          enum: ["hours", "days", "weeks", "months"],
        },
      },
      advanced_options: {
        default_comment_order: {
          type: String,
          enum: [
            "Default comment order",
            "Best",
            "Top",
            "New",
            "Controversial",
            "Old",
            "Q&A",
          ],
        },
        not_a_sticky_post: {
          type: String,
          enum: [
            "not_a_sticky_post",
            "submit_as_first_sticky_post",
            "submit_as_second_sticky_post",
          ],
        },
      },
      contest_mode_flag: {
        type: Boolean,
        default: false,
      },
      post_as_auto_moderator_flag: {
        type: Boolean,
        default: false,
      },
    },
  ],
  allow_image_posts: {
    type: Boolean,
    default: true,
  },
  allow_url_posts: {
    type: Boolean,
    default: true,
  },
  allow_polls_posts: {
    type: Boolean,
    default: true,
  },
  rules_ids: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Rule",
    },
  ],

});

export const Community = mongoose.model("Community", communitySchema);