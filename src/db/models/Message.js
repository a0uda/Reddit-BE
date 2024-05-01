// Import mongoose
import mongoose from "mongoose";

// Define the message schema
const messageSchema = new mongoose.Schema({
    sender_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    sender_via_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Community",
        default: null
    },
    sender_type: {
        type: String,
        enum: ["user", "moderator"],
        required: true
    },
    receiver_id: {
        type: mongoose.Schema.Types.ObjectId,
        refPath: "receiver_type", // Dynamically set based on receiver_type
        required: true
    },
    receiver_type: {
        type: String,
        enum: ["user", "moderator"],
        required: true
    },
    message: {
        type: String,
        required: true
    },
    created_at: {
        type: Date,
        default: Date.now
    },
    subject: {
        type: String,
        required: true
    },
    deleted_at: {
        type: Date,
        default: null
    },
    unread_flag: {
        type: Boolean,
        default: true
    },
    reported_flag: {
        type: Boolean,
        default: false
    },
    parent_message_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Message",
        default: null
    },
    is_invitation: {
        type: Boolean,
        default: false
    }
});

// Export the Message model
export const Message = mongoose.model("Message", messageSchema);

// Function to set the refPath dynamically
function setRefPath(receiverType) {
    // Define the path based on receiverType
    if (receiverType === "user") {
        return "User";
    } else if (receiverType === "moderator") {
        return "Community";
    } else {
        throw new Error("Invalid receiver type");
    }
}

// Export the function
export { setRefPath };
