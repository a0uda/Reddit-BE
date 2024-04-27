//create the message model of reddit 
import mongoose from "mongoose";


// const ruleSchema = new mongoose.Schema({
//     rule_title: {
//         type: String,
//         required: true,
//         unique: true,
//     },
//     rule_order: {
//         // => determined by db
//         type: Number,
//         min: 1,
//     },
//     applies_to: {
//         // => chosen by default
//         type: String,
//         enum: ["posts_and_comments", "posts_only", "comments_only"],
//     },
//     report_reason: String, // => if not provided, use rule_title
//     full_description: String, // => optional
// });

// export const Rule = mongoose.model("Rule", ruleSchema);
/* _id: "5da456f4307b0a8b308384k53831",
        sender_username: "reem",
        sender_type: "user",
        senderVia: "subreddit",
        receiver_username: "subreddit",
        receiver_type: "moderator",
        message: "content 4",
        created_at: "01/01/2024",
        deleted_at: "15/10/2024",
        unread_flag: false,
        isSent: false,
        isReply: true,
        parentMessageId: "5da454f4307b0a8b30838831",
        subject: "header 3", */
const messageSchema = new mongoose.Schema({
    sender_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    },
    sender_type: {
        type: String,
        enum: ["user", "moderator"],
    },
    receiver_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    },
    receiver_type: {
        type: String,
        enum: ["user", "moderator"],
    },
    message: {
        type: String,
        required: true,
    },
    created_at: {
        type: Date,
        default: Date.now,
    },
    subject: {
        type: String,
        required: true,
    },
    deleted_at: {
        type: Date,
    },
    unread_flag: {
        type: Boolean,
        default: true,
    },
    parentMessageId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Message",
        required: false,
    },




});
export const Message = mongoose.model("Message", messageSchema);
