import mongoose from "mongoose";

const communityGeneralSettingsSchema = new mongoose.Schema({
    title: {
        type: String,
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
    visibility: {
        type: String,
        enum: ["Public", "Private", "Restricted"],
    },
    nsfw_flag: {
        type: Boolean,
        default: false,
    }
});


export const CommunityGeneralSettings = mongoose.model(
    "CommunityGeneralSettings",
    communityGeneralSettingsSchema
);