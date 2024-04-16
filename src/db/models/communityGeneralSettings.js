import mongoose from "mongoose";

const communityGeneralSettingsSchema = new mongoose.Schema({
    title: {
        type: String,
        default: "",
    },
    description: {
        type: String,
        default: "",
    },
    welcome_message: {
        send_welcome_message_flag: {
            type: Boolean,
            default: false,
        },
        message: {
            type: String,
            default: "",
        },
    },
    type: {
        type: String,
        enum: ["Public", "Private", "Restricted"],
        default: "Public",
    },
    nsfw_flag: {
        type: Boolean,
        default: false,
    },
    // Restricted Community Settings.
    approved_users_have_the_ability_to: {
        type: String,
        enum: ["Post Only (Default)", "Comment Only", "Post and Comment"],
        default: "Post Only (Default)",
    },
    accepting_new_requests_to_post: {
        type: Boolean,
        default: true,
    },
    // Private Community Settings.
    accepting_requests_to_join: {
        type: Boolean,
        default: true,
    },
});


export const CommunityGeneralSettings = mongoose.model(
    "CommunityGeneralSettings",
    communityGeneralSettingsSchema
);