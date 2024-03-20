import mongoose from "mongoose";

const communityPostsAndCommentsSchema = new mongoose.Schema({

    posts: {
        post_type_options: {
          type: String,
          enum: ["Any", "Links Only", "Text Posts Only"],
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
        spam_filter_strength: {  // TODO: When exploring thse settings, "Low" was chosen by default, but the one of the other options was "High (default)". So, what is the default value?
          posts: {
            type: String,
            enum: ["Low", "High (default)", "All"],
          },
          links: {
            type: String,
            enum: ["Low", "High (default)", "All"],
          },
          comments: {
            type: String,
            enum: ["Low (default)", "High", "All"],
          },
        }
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
          default: "None (Recommended)",
        },
        collapse_deleted_and_removed_comments: {
          type: Boolean,
          default: true,
        },
        minutes_to_hide_comment_scores: { // TODO: I don't understand the purpose of this setting. What does it mean to hide the comment scores?
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
      }
});

const CommunityPostsAndComments = mongoose.model("CommunityPostsAndComments", communityPostsAndCommentsSchema);
export default CommunityPostsAndComments;