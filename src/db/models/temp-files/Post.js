import mongoose from "mongoose";

export const postSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
    },

    deleted: {
        type: Boolean,
        default: false,
    },
    approved: {
        type: Boolean,
        default: false,
    },
    followers_ids: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    comments_count: { type: Number, default: 0 },
    views_count: { type: Number, default: 0 },
    shares_count: { type: Number, default: 0 },
    upvotes_count: { type: Number, default: 0 },
    downvotes_count: { type: Number, default: 0 },
    oc_flag: { type: Boolean, default: false },
    spoiler_flag: { type: Boolean, default: false },
    nsfw_flag: { type: Boolean, default: false },
    locked_flag: { type: Boolean, default: false },
    moderator_details: {
        approved_by: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        approved_date: { type: Date },
        removed_by: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        removed_date: { type: Date },
        spammed_by: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        spammed_type: { type: String },
        removed_flag: { type: Boolean, default: false },
        spammed_flag: { type: Boolean, default: false },
    },
    user_details: {
        total_views: { type: Number, default: 0 },
        upvote_rate: { type: Number, default: 0 },
        total_shares: { type: Number, default: 0 },
    },
});
export const Post = mongoose.model("post", postSchema);
