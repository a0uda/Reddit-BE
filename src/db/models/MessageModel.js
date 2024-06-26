import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
	{
		senderId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: true,
		},
		receiverId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: true,
		},
		message: {
			type: String,
			required: true,
		},
		reported: {
			flag: {
				type: Boolean,
				default: false
			},
			reason: {
				type: String,
				enum: ['Harassment', 'Threating Violence', 'Hate', 'Minor abuse', 'Sharing personal information', 'Porhibited transaction', 'Impersonation', 'Copyright violation', 'Trademark violation', 'Delf-harm or suicide', 'Spam'], // replace with your actual reasons
				default: null
			}
		},
		removed: {
			flag: {
				type: Boolean,
				default: false
			}
		}
	},
	{ timestamps: true }
);

const MessageModel = mongoose.model("MessageModel", messageSchema);
export default MessageModel;