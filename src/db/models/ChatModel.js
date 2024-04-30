import mongoose from "mongoose";

const chatSchema = new mongoose.Schema(
	{
		participants: [
			{
				type: mongoose.Schema.Types.ObjectId,
				ref: "User",
			},
		],
		messages: [
			{
				type: mongoose.Schema.Types.ObjectId,
				ref: "MessageModel",
				default: [],
			},
		],
	},
	{ timestamps: true }
);

const ChatModel = mongoose.model("ChatModel", chatSchema);

export default ChatModel;
