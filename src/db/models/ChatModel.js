// import mongoose from "mongoose";

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
		lastMessage: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "MessageModel",
		},
	},
	// The { timestamps: true } option in a Mongoose schema automatically adds two new fields to the schema: createdAt and updatedAt.
	{ timestamps: true }
);

const ChatModel = mongoose.model("ChatModel", chatSchema);

// export default ChatModel;
