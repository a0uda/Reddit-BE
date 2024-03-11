const { Timestamp } = require("mongodb");
const mongoose = require("mongoose");

const communitySchema = new mongoose.Schema({
  created_at: {
    type: Date,
    required: true,
    default: Date.now(),
  },
  name: {
    type: String,
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ["public", "private", "restricted", "employee only"],
  },
  category: {
    type: String,
  },
  nswf_flag: {
    type: Boolean,
    default: false,
  },
  profile_picture: {
    type: String,
  },
  banner_picture: {
    type: String,
  },
  members_nickname: {
    type: String,
    default: "Members",
  },
  currently_viewing_nickname: {
    type: String,
    default: "Online",
  },
  description: {
    type: String,
  },
  welcome_message: {
    send_welcome_message_flag: {
      type: Boolean,
      default: false,
    },
    message: {
      type: String,
    },
  },
  language: {
    type: String,
    default: "English",
  },
  region: {
    type: String,
  },
  accepting_requests_to_join: {
    type: String,
    default: true,
  },
  content_controls: {
    providing_members_with_posting_guidlines: {
      flag: {
        type: Boolean,
        default: false,
      },
      guidline_text: String,
    },
    require_words_in_post_title: {
      flag: {
        type: Boolean,
        default: false,
      },
      add_required_words: String,
    },
    ban_words_in_post_body: {
      flag: {
        type: Boolean,
        default: false,
      },
      add_banned_words: String,
    },
    require_or_ban_links_from_specific_domains: {
      flag: {
        type: Boolean,
        default: false,
      },
      restriction_type: {
        type: String,
        enum: ["required_domains", "blocked_domains"],
      },
      block_link_posts_with_these_domains: String,
    },
    restrict_how_often_the_same_link_can_be_posted: {
      flag: {
        type: Boolean,
        default: false,
      },
      number_of_days: {
        type: Number,
        min: 0,
      },
    },
  },
  posts_and_comments: {
    post_type_options: {
      type: String,
      enum: ["any", "links only", "text posts only"],
    },
    allow_crossposting_of_posts: {
      type: Boolean,
      default: true,
    },
    archive_posts: {
      type: Boolean,
      default: false,
    },
    enable_spoiler_tag: {
      type: Boolean,
      default: true,
    },
    allow_image_uploads_and_links_to_image_hosting_sites: {
      type: Boolean,
      default: true,
    },
    allow_multiple_images_per_post: {
      type: Boolean,
      default: true,
    },
    allow_polls: {
      type: Boolean,
      default: true,
    },
    spam_filter_strength: {
      posts: {
        type: String,
        enum: ["low", "high (default)", "all"],
      },
      links: {
        type: String,
        enum: ["low", "high (default)", "all"],
      },
      comments: {
        type: String,
        enum: ["low (default)", "high", "all"],
      },
    },
    comments: {
      suggested_sort: {
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
      collapse_deleted_and_removed_comments: {
        type: Boolean,
        default: true,
      },
      minutes_to_hide_comment_scores: {
        type: Number,
        min: 0,
      },
      media_in_comments: {
        gifs_from_giphy: {
          type: Boolean,
          default: true,
        },
        collectible_expressions: {
          type: Boolean,
          default: true,
        },
        images: {
          type: Boolean,
          default: true,
        },
        gifs: {
          type: Boolean,
          default: true,
        },
      },
    },
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
  members_count: {
    type: Number,
    min: 0,
    default: 0,
  },
  moderators: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],
  invited_moderators: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],
  users: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
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
  posts_ids: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post",
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
        type: Timestamp,
      },
      time_zone: {
        type: Timestamp,
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
  rules: [
    {
      rule_title: String,
      rule_order: {
        type: Number,
        min: 1,
      },
      applies_to: {
        type: String,
        enum: ["posts_and_comments", "posts_only", "comments_only"],
      },
      report_reason: String,
      full_description: String,
    },
  ],
});

const Community = mongoose.model("Community", communitySchema);

module.exports = Community;
