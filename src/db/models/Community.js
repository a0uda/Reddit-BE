import mongoose from "mongoose";

const communitySchema = new mongoose.Schema({
  //////////////////////////////////////////////////// Attributes filled when creating a community ////////////////////////////////////////////////////
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

  // TODO: "title" is an attribute in the "general settings" subdocument that needs to be filled eith the "name" attribute of the community when creating it.
  // TODO: "type" is an attribute in the "general settings" subdocument that needs to be filled with the "type" value provided by the user when creating the community.

  // This is a costume attribute required in the project that does not exist in reddit itself.
  category: {
    type: String,
    enum: [
      "Technology",
      "Science",
      "Music",
      "Sports",
      "Gaming",
      "News",
      "Movies",
      "Books",
      "Fashion",
      "Food",
      "Travel",
      "Health",
      "Art",
      "Photography",
      "Education",
      "Business",
      "Finance",
      "Politics",
      "Religion",
      "DIY",
      "Pets",
      "Environment",
      "Humor",
      "Personal",
    ],
    default: "Personal",
  },

  // TODO: "nsfw_flag" is an attribute in the "general settings" subdocument that needs to be filled with the "nsfw_flag" value provided by the user when creating the community.

  // Initialized to zero on creation and incremented when a user joins the community and decremented when a user leaves the community.
  members_count: {
    type: Number,
    min: 0,
    default: 0,
  },

  // TODO: Should be set to the user who created the community.
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },

  //////////////////////////////////////////////// Subdocuments for the community settings - Part 1////////////////////////////////////////////////////
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

  ////////////////////////////////////////////////////// User Management //////////////////////////////////////////////////////
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
      username: {
        type: String,
        ref: "User",
      },
      muted_by_username: {
        type: String,
        ref: "User",
      },
      mute_date: Date,
      mute_reason: String,
      profile_picture: String
    },
  ],
  banned_users: [
    {
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
      profile_picture: {
        type: String,
      },
    },
  ],
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

  ////////////////////////////////////////////////////// Rules & Removal Reasons //////////////////////////////////////////////////////
  rules_ids: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Rule",
    },
  ],
  removal_reasons: [
    {
      removal_reason_title: {
        type: String,
        required: true,
      },
      reason_message: {
        type: String,
        required: false,
      },
    },
  ],
  ////////////////////////////////////////////////////// Profile & Banner Pictures //////////////////////////////////////////////////////
  profile_picture: {
    type: String,
    default: "",
  },
  banner_picture: {
    type: String,
    default: "",
  },

  ////////////////////////////////////////////////////// Edit Community Details Widget //////////////////////////////////////////////////////
  members_nickname: {
    type: String,
    default: "Members",
  },
  currently_viewing_nickname: {
    type: String,
    default: "Online",
  },

  // TODO: "description" is an attribute in the "general settings" subdocument that needs to be filled with the "description" value provided by the user in the "edit community details widget".



  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  //TODO: These do not appear in the databse we are seeding.
  // I will work on adding them once I understand what they are used for.
  // traffic: String,
  // topics: String,

  // views_count: {
  //   type: Number,
  //   min: 0,
  //   default: 0,
  // },
});

export const Community = mongoose.model("Community", communitySchema);

// The posts or comments themselves will store a reference for the community they were written in.
// The same applies to scheduled posts.
// A flag indicating that the post or comment is removed, edited, unmoderated, or reported will be stored in the post or comment itself.