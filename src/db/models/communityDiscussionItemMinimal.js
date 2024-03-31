import mongoose from "mongoose";

export const discussionItemMinimalSchema = new mongoose.Schema({

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
        default: Date.now,
    },
    discussion_item_type: {
        type: String,
        enum: ["post", "comment"],
        required: true,
    },
    written_in_community: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Community",
    },
    marked_as_spam_by_a_moderator: {
        type: Boolean,
        default: false,
    },
    edited_flag: {
        type: Boolean,
        default: false,
    },
    unmoderated_flag: {
        type: Boolean,
        default: true,
    },
});

export const DiscussionItemMinimal = mongoose.model("DiscussionItemMinimal", discussionItemMinimalSchema);