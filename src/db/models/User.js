import mongoose from "mongoose";
import validator from "validator";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const userSchema = new mongoose.Schema({
  created_at: {
    type: Date,
    default: Date.now(),
  },
  deleted_at: {
    type: Date,
    default: null,
  },
  deleted: {
    type: Boolean,
    default: false,
  },
  username: {
    type: String,
    required: true,
    unique: true,
  },
  token: {
    type: String,
    default: null,
  },
  password: {
    type: String,
    minlength: 8,
  },
  is_password_set_flag: {
    type: Boolean,
    default: false,
  },
  connected_google: {
    type: Boolean,
    default: false,
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    unique: true,
    validate(value) {
      if (!validator.isEmail(value)) {
        throw new Error("Email is invalid");
      }
    },
  },

  verified_email_flag: {
    type: Boolean,
    default: false,
  },

  gmail: {
    type: String,
    unique: true,
    sparse: true,
  },
  facebook_email: {
    type: String,
    unique: true,
    sparse: true,
  },
  display_name: {
    type: String,
    required: true,
    default: function () {
      return this.username;
    },
  },
  about: {
    type: String,
    default: "",
  },
  social_links: [
    {
      _id: mongoose.Schema.Types.ObjectId,
      username: {
        type: String,
      },
      display_text: {
        type: String,
        default: null,
      },
      type: {
        type: String,
        enum: [
          "instagram",
          "facebook",
          "custom_url",
          "reddit",
          "twitter",
          "tiktok",
          "twitch",
          "youtube",
          "spotify",
          "soundcloud",
          "discord",
          "paypal",
        ],
      },
      custom_url: {
        type: String,
      },
    },
  ],
  profile_picture: {
    type: String, //URL
    default: "",
  },
  banner_picture: {
    type: String, //URL
    default: "",
  },
  profile_settings: {
    nsfw_flag: {
      type: Boolean,
      default: false,
    },
    allow_followers: {
      type: Boolean,
      default: true,
    },
    content_visibility: {
      type: Boolean,
      default: true,
    },
    active_communities_visibility: {
      type: Boolean,
      default: true,
    },
  },
  safety_and_privacy_settings: {
    blocked_users: {
      type: Array,
      properties: {
        id: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        blocked_date: {
          type: Date,
          default: null,
        },
      },
    },
    muted_communities: [
      {
        id: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Community",
        },
        muted_date: {
          type: Date,
          default: null,
        },
      },
    ],
  },

  feed_settings: {
    Adult_content_flag: {
      type: Boolean,
      default: false,
    },
    autoplay_media: {
      type: Boolean,
      default: true,
    },
    communitiy_content_sort: {
      type: {
        type: String,
        enum: ["top", "hot", "new", "rising"],
        default: "top",
      },
      duration: {
        type: String,
        enum: [
          "now",
          "today",
          "this_week",
          "this_month",
          "this_year",
          "all_time",
        ],
        default: "now",
      },
      sort_remember_per_community: {
        type: Boolean,
        default: false,
      },
    },
    global_content: {
      global_content_view: {
        type: String,
        enum: ["card", "classical", "compact"],
        default: "card",
      },
      global_remember_per_community: {
        type: Boolean,
        default: false,
      },
    },
    Open_posts_in_new_tab: {
      type: Boolean,
      default: false,
    },
    community_themes: {
      type: Boolean,
      default: true,
    },
  },
  notifications_settings: {
    mentions: {
      type: Boolean,
      default: true,
    },


    comments: {
      type: Boolean,
      default: true,
    },
    upvotes_posts: {
      type: Boolean,
      default: true,
    },
    upvotes_comments: {
      type: Boolean,
      default: true,
    },
    replies: {
      type: Boolean,
      default: true,
    },
    new_followers: {
      type: Boolean,
      default: true,
    },
    invitations: {
      type: Boolean,
      default: true,
    },
    posts: {
      type: Boolean,
      default: true,
    },
    private_messages: {
      type: Boolean,
      default: true,
    },
    chat_messages: {
      type: Boolean,
      default: true,
    },
    chat_requests: {
      type: Boolean,
      default: true,
    },
  },
  chat_and_messaging_settings: {
    who_send_chat_requests_flag: {
      type: String,
      enum: ["Everyone", "Accounts Older than 30 days", "Nobody"],
      default: "Everyone",
    },
    who_send_private_messages_flag: {
      type: String,
      enum: ["Everyone", "Accounts Older than 30 days", "Nobody"],
      default: "Everyone",
    },
  },
  email_settings: {
    new_follower_email: {
      type: Boolean,
      default: true,
    },
    chat_request_email: {
      type: Boolean,
      default: true,
    },
    unsubscribe_from_all_emails: {
      type: Boolean,
      default: false,
    },
  },

  followed_posts_ids: {
    type: Array,
    items: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  saved_posts_ids: {
    type: Array,
    items: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post",
    },
  },
  hidden_and_reported_posts_ids: {
    type: Array,
    items: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post",
    },
  },
  history_posts_ids: {
    type: Array,
    items: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post",
    },
  },
  upvotes_posts_ids: {
    type: Array,
    items: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post",
    },
  },
  downvotes_posts_ids: {
    type: Array,
    items: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post",
    },
  },
  //mafesh hide comments heya reported bas
  reported_comments_ids: {
    type: Array,
    items: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Comment",
    },
  },
  saved_comments_ids: {
    type: Array,
    items: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Comment",
    },
  },
  saved_categories_ids: {
    type: Array,
  },
  country: {
    type: String,
    default: null,
  },
  gender: {
    type: String,
    enum: ["Male", "Female"],
    default: "Male",
  },
  followers_ids: {
    type: Array,
    items: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  following_ids: {
    type: Array,
    items: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  notifications_ids: {
    type: Array,
    items: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Notification",
    },
  },
  unread_notifications_count: {
    type: Number,
    min: 0,
    default: 0,
  },
  communities: {
    type: Array,
    items: {
      type: Object,
      properties: {
        id: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Community",
        },
        favorite_flag: {
          type: Boolean,
          default: false,
        },
        disable_updates: {
          type: Boolean,
          default: false,
        },
      },
    },
  },
  moderated_communities: {
    type: Array,
    items: {
      type: Object,
      properties: {
        id: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Community",
        },
        favorite_flag: {
          type: Boolean,
          default: false,
        },
      },
    },
  },
  reported_users: {
    type: Array,
    items: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  user_mentions: {
    type: Array,
    items: {
      type: Object,
      properties: {
        post_id: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Post",
        },
        comment_id: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Comment",
        },
        sender_username: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        unread_flag: {
          type: Boolean,
          default: true
        }
      },
    },
  },
  tickets_ids: {
    type: Array,
    items: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Ticket",
    },
  },
});


userSchema.pre("save", async function (next) {
  const user = this;
  if (user.isModified("password")) {
    user.password = await bcrypt.hash(
      user.password,
      parseInt(process.env.PASSWORD_HASH_SALT)
    );
  }

  //set an id for social link
  user.social_links.forEach((link) => {
    if (!link._id) {
      link._id = new mongoose.Types.ObjectId();
    }
  });

  next();
});

//Don't return user if he is deleted
userSchema.pre("find", function () {
  this.where({ deleted: false });
  // next();
});

userSchema.methods.generateAuthToken = async function () {
  const user = this;
  this.token = jwt.sign(
    {
      _id: user._id.toString(),
      username: user.username,
      profile_picture: user.profile_picture,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "1d",
    }
  );
  const refreshToken = jwt.sign(
    { _id: user._id.toString() },
    process.env.JWT_SECRET,
    { expiresIn: "8d" }
  );
  return refreshToken;
};

export const User = mongoose.model("User", userSchema);
