import mongoose from "mongoose";

const tempcommentSchema = new mongoose.Schema({

    approved: {
        type: Boolean,
        default: false,
    },
    deleted: {
        type: Boolean,
        default: false,
    },
    description: {
        type: String,
        required: true,
    },
    spam_flag: {
        type: Boolean,
        default: false,
    },
    locked_flag: {
        type: Boolean,
        default: false,
    },
    moderator_details: {
        approved_by: String,
        approved_date: Date,
        removed_by: String,
        removed_date: Date,
        spammed_by: String,
        spammed_type: String,
        removed_flag: {
            type: Boolean,
            default: false,
        },
        spammed_flag: {
            type: Boolean,
            default: false,
        },
    },
});

export const TempComment = mongoose.model("TempComment", tempcommentSchema);
