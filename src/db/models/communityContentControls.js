import mongoose from "mongoose";

const communityContentControlsSchema = new mongoose.Schema({
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
    add_required_words: [String],
  },
  ban_words_from_post_title: {
    flag: {
      type: Boolean,
      default: false,
    },
    add_banned_words: [String],
  },
  ban_words_from_post_body: {
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
      enum: ["Required domains", "Blocked domains"],
    },
    require_or_block_link_posts_with_these_domains: String,
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
});

export const CommunityContentControls = mongoose.model(
  "CommunityContentControls",
  communityContentControlsSchema
);
