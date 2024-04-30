import ChatModel from "../db/models/ChatModel.js"
import MessageModel from "../db/models/MessageModel.js"
import { User } from "../db/models/User.js";

import { getReceiverSocketId, io } from "../socket/socket.js";

// TODO: Error handling in all three functions is missing.

export const sendMessage = async (req, res) => {
	try {
		const { message } = req.body;
		const { username: receiverUsername } = req.params;
		const sender = req.user;

		// Validating the sender and receiver.
		let receiver;
		try {
			receiver = await User.findOne({ username: receiverUsername });
		} catch (error) {
			return res.status(500).json({ err: { status: 500, message: 'Error finding receiver' } });
		}

		if (!receiver || !sender) {
			return res.status(404).json({ err: { status: 404, message: 'Receiver or sender not found' } });
		}

		if (receiver.username === sender.username) {
			return res.status(400).json({ err: { status: 400, message: 'Sender and receiver cannot be the same' } });
		}

		// Validating the message
		if (!message) {
			return res.status(400).json({ err: { status: 400, message: 'A message must be provided' } });
		}


		// Check if the chat already exists. If not, create a new chat.
		let chat;
		try {
			// It's looking for a document where the participants field contains all the elements listed.
			chat = await ChatModel.findOne({
				participants: { $all: [receiver._id, sender._id] },
			});
		} catch (error) {
			return res.status(500).json({ err: { status: 500, message: 'Error when attemptiong to find an existing chat' } });
		}

		if (!chat) {
			try {
				chat = await ChatModel.create({
					participants: [receiver._id, sender._id],
				});
			} catch (error) {
				return res.status(500).json({ err: { status: 500, message: 'Error when attempting to create a chat' } });
			}
		}

		// Create a new message and add it to the chat.
		const newMessage = new MessageModel({
			senderId: sender._id,
			receiverId: receiver._id,
			message,
		})

		if (!newMessage) {
			return res.status(500).json({ err: { status: 500, message: 'Failed to create new message' } });
		}

		chat.messages.push(newMessage._id);

		try {
			// this will run in parallel
			const [savedChat, savedMessage] = await Promise.all([chat.save(), newMessage.save()]);

			if (!savedChat || !savedMessage) {
				return res.status(500).json({ err: { status: 500, message: 'Failed to save chat or message' } });
			}
		} catch (error) {
			console.error("Error saving chat or message: ", error);
			return res.status(500).json({ err: { status: 500, message: 'Error saving chat or message' } });
		}

		// SOCKETS: Emit the new message to the receiver.
		const receiverSocketId = getReceiverSocketId(receiver._id);
		if (receiverSocketId) {
			// io.to(<socket_id>).emit() used to send events to specific client
			io.to(receiverSocketId).emit("newMessage", newMessage);
		}

		return res.status(201).json(newMessage);
	} catch (error) {
		return res.status(500).json({ err: { status: 500, message: error.message } });
	}
};







export const getMessages = async (req, res) => {
    try {
        const { username: receiverUsername } = req.params;
        const sender = req.user;

        // Validate sender and receiver
        let receiver;
        try {
            receiver = await User.findOne({ username: receiverUsername });
        } catch (error) {
            return res.status(500).json({ err: { status: 500, message: 'Error finding receiver' } });
        }

        if (!sender || !receiver) {
            return res.status(404).json({ err: { status: 404, message: 'Sender or receiver not found' } });
        }

        if (sender._id.toString() === receiver._id.toString()) {
            return res.status(400).json({ err: { status: 400, message: 'Cannot get messages with yourself' } });
        }

        // Find chat
        let chat;
        try {
            chat = await ChatModel.findOne({
                participants: { $all: [sender._id, receiver._id] },
            }).populate("messages");
        } catch (error) {
            return res.status(500).json({ err: { status: 500, message: 'Error when attempting to find chat' } });
        }

        if (!chat) {
            return res.status(404).json({ err: { status: 404, message: 'Chat not found' } });
        }

        const messages = chat.messages;

        res.status(200).json(messages);
    } catch (error) {
        return res.status(500).json({ err: { status: 500, message: error.message } });
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

export const reportMessage = async (req, res) => {
	try {
		const { id: messageId } = req.params;
		const { reason } = req.body;
		const senderId = req.user._id;

		if (!messageId || !reason || !senderId) {
			return res.status(400).json({ err: { status: 400, message: 'Invalid input parameters' } });
		}

		// Check if the reason is valid
		const validReasons = MessageModel.schema.path('report.reason').enumValues.map(value => value.toLowerCase());

		if (!validReasons.includes(reason.toLowerCase())) {
			return res.status(400).json({ err: { status: 400, message: 'Invalid report reason' } });
		}

		// Debugging
		const messages = await MessageModel.find();
		console.log('Messages: ', messages);

		// Find the message
		let message;
		try {
			message = await MessageModel.findOne({ _id: messageId });
		}
		catch (error) {
			console.error('Error finding message: ', error.message);
			return res.status(500).json({ err: { status: 500, message: 'Error finding message' } });
		}

		if (!message) {
			return res.status(404).json({ err: { status: 404, message: 'Message not found' } });
		}

		// Check if the user is reporting their own message
		if (message.senderId.toString() === senderId) {
			return res.status(400).json({ err: { status: 400, message: 'You cannot report your own message' } });
		}

		// Update the report flag and reason
		message.report.flag = true;
		message.report.reason = reason;

		// Save the message
		await message.save();

		res.status(200).json({ message: 'Report submitted successfully' });
	} catch (error) {
		console.error('Error in reportMessage: ', error.message);
		res.status(500).json({ err: { status: 500, message: 'Internal server error' } });
	}
};