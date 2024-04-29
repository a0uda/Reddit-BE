import ChatModel from "../db/models/ChatModel.js"
import MessageModel from "../db/models/MessageModel.js"
import { User } from "../db/models/User.js";

import { getReceiverSocketId, io } from "../socket/socket.js";

// TODO: Error handling in all three functions is missing.

export const sendMessage = async (req, res) => {
	try {
		const { message } = req.body;
		const { id: receiverId } = req.params;
		const senderId = req.user._id;

		let chat = await ChatModel.findOne({
			participants: { $all: [senderId, receiverId] },
		});

		if (!chat) {
			chat = await ChatModel.create({
				participants: [senderId, receiverId],
			});
		}

		const newMessage = new MessageModel({
			senderId,
			receiverId,
			message,
		});

		if (newMessage) {
			ChatModel.messages.push(newMessage._id);
		}

		// this will run in parallel
		await Promise.all([chat.save(), newMessage.save()]);

		// SOCKET IO FUNCTIONALITY WILL GO HERE
		const receiverSocketId = getReceiverSocketId(receiverId);
		if (receiverSocketId) {
			// io.to(<socket_id>).emit() used to send events to specific client
			io.to(receiverSocketId).emit("newMessage", newMessage);
		}

		return res.status(201).json(newMessage);
	} catch (error) {
		console.log("Error in sendMessage controller: ", error.message);
		res.status(500).json({ error: "Internal server error" });
	}
};

export const getMessages = async (req, res) => {
	try {
		const { id: userToChatId } = req.params;
		const senderId = req.user._id;

		const chat = await ChatModel.findOne({
			participants: { $all: [senderId, userToChatId] },
		}).populate("messages"); // NOT REFERENCE BUT ACTUAL MESSAGES

		if (!chat) return res.status(200).json([]);

		const messages = chat.messages;

		res.status(200).json(messages);
	} catch (error) {
		console.log("Error in getMessages controller: ", error.message);
		res.status(500).json({ error: "Internal server error" });
	}
};

// TODO: The filter must be re-written.
export const getUsersForSidebar = async (req, res) => {
	try {
		const loggedInUserId = req.user._id;

		const filteredUsers = await User.find({ _id: { $ne: loggedInUserId } }).select("-password");

		res.status(200).json(filteredUsers);
	} catch (error) {
		console.error("Error in getUsersForSidebar: ", error.message);
		res.status(500).json({ error: "Internal server error" });
	}
};
