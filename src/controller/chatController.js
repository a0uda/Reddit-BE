import ChatModel from "../db/models/ChatModel.js"
import MessageModel from "../db/models/MessageModel.js"
import { User } from "../db/models/User.js";

/// TODO: Uncomment.
// import { getReceiverSocketId, io } from "../socket/socket.js";

// TODO: Error handling messages.

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


		// Create a new message and add it to the chat.
		const newMessage = new MessageModel({
			senderId: sender._id,
			receiverId: receiver._id,
			message,
		})

		if (!newMessage) {
			return res.status(500).json({ err: { status: 500, message: 'Failed to create new message' } });
		}


		// Check if the chat already exists. If not, create a new chat.
		let chat;
		try {
			// Find a chat where both senderId and receiverId are participants
			// and update the lastMessage field with the ID of the new message
			// and add the new message to the messages array
			chat = await ChatModel.findOneAndUpdate(
				// Search criteria: a chat where both senderId and receiverId are participants
				{ participants: { $all: [sender._id, receiver._id] } },

				// Update operation: set the lastMessage field to the ID of the new message
				// and add the new message to the messages array
				{
					$set: { lastMessage: newMessage._id },
					$push: { messages: newMessage._id }
				},

				// Options: return the modified document
				{ new: true }
			);
		} catch (error) {
			return res.status(500).json({ err: { status: 500, message: 'Error when attempting to find an existing chat' } });
		}
		
		if (!chat) {
			try {
				chat = await ChatModel.create({
					participants: [receiver._id, sender._id],
					messages: [newMessage._id],
					lastMessage: newMessage._id,
				});
			} catch (error) {
				return res.status(500).json({ err: { status: 500, message: 'Error when attempting to create a chat' } });
			}
		}

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

		/// TODO: Uncomment.

		// // SOCKETS: Emit the new message to the receiver.
		// const receiverSocketId = getReceiverSocketId(receiver._id);
		// if (receiverSocketId) {
		// 	// io.to(<socket_id>).emit() used to send events to specific client
		// 	io.to(receiverSocketId).emit("newMessage", newMessage);
		// }

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





export const getUsersForSidebar = async (req, res) => {
  try {
    const loggedInUserId = req.user._id;

    // Find chats where the logged in user is a participant
    const chats = await ChatModel.find({ participants: loggedInUserId })
      .populate({
        path: "participants",
        match: { _id: { $ne: loggedInUserId } }, // Exclude logged-in user
        select: "username", // Only select username from participants
      })
      .populate({
        path: "lastMessage",
        select: "senderId message createdAt", // Only select these fields from lastMessage
      })
      .exec();

    // Format chat data
    const formattedChats = chats.map((chat) => {
      const otherParticipant = chat.participants.find(
        (participant) => participant._id.toString() !== loggedInUserId.toString()
      );

      // Handle case where there might not be another participant (e.g., private message to yourself)
      if (!otherParticipant) {
        return null; // Or some default value if applicable
      }

      const lastMessage = chat.lastMessage;
      const lastMessageSender = lastMessage?.senderId?.toString() === loggedInUserId.toString() ? "You" : otherParticipant.username;
      const lastMessageText = lastMessage?.message;
      const lastMessageTimestamp = lastMessage?.createdAt;

      return {
        _id: chat._id, // Include chat ID for identification
        otherUsername: otherParticipant.username,
        lastMessageSender, // Username of the last message sender
        lastMessageText, // Text of the last message
        lastMessageTimestamp, // Timestamp of the last message
      };
    });

    res.status(200).json(formattedChats.filter(chat => chat !== null)); // Remove any null values

  } catch (error) {
    console.error("Error in getUsersForSidebar: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};





export const reportMessage = async (req, res) => {
	try {
		const { id: messageId } = req.params;
		const { reason } = req.body;
		const reportingUserId = req.user._id;

		if (!messageId || !reason || !reportingUserId) {
			return res.status(400).json({ err: { status: 400, message: 'Invalid input parameters' } });
		}

		// Check if the reason is valid
		const validReasons = MessageModel.schema.path('report.reason').enumValues.map(value => value.toLowerCase());

		if (!validReasons.includes(reason.toLowerCase())) {
			return res.status(400).json({ err: { status: 400, message: 'Invalid report reason' } });
		}

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

		// The receiver of the message is the only one allowed to report it.
		if (message.receiverId.toString() !== reportingUserId.toString()) {
			return res.status(403).json({ err: { status: 403, message: 'You are not allowed to report this message' } });
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




// Remove message, a user can only remove his own message
export const removeMessage = async (req, res) => {
  try {
	const { id: messageId } = req.params;
	const removingUserId = req.user._id;

	if (!messageId) {
	  return res.status(400).json({ err: { status: 400, message: 'Invalid input parameters' } });
	}

	// Find the message
	let message;
	try {
	  message = await MessageModel.findOne({ _id: messageId });
	} catch (error) {
	  console.error('Error finding message: ', error.message);
	  return res.status(500).json({ err: { status: 500, message: 'Error finding message' } });
	}

	if (!message) {
	  return res.status(404).json({ err: { status: 404, message: 'Message not found' } });
	}

	// The sender of the message is the only one allowed to remove it
	if (message.senderId.toString() !== removingUserId.toString()) {
	  return res.status(403).json({ err: { status: 403, message: 'You are not allowed to remove this message' } });
	}

	// Set the remove flag to true
	message.remove.flag = true;

	res.status(200).json({ message: 'Message removed successfully' });
  } catch (error) {
	console.error('Error in removeMessage: ', error.message);
	res.status(500).json({ err: { status: 500, message: 'Internal server error' } });
  }
};