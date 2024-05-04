import ChatModel from "../db/models/ChatModel.js"
import MessageModel from "../db/models/MessageModel.js"
import { User } from "../db/models/User.js";

// TODO: Uncomment.
import { getReceiverSocketId, io } from "../socket/socket.js";

const sendMessage = async (sender, receiverUsername, message) => {
    // Validating the sender and receiver.
    let receiver;
    try {
        receiver = await User.findOne({ username: receiverUsername });
    } catch (error) {
        return { err: { status: 500, message: `Error finding receiver with username: ${receiverUsername}` } };
    }

    if (!receiver || !sender) {
        return { err: { status: 404, message: 'Either the receiver or sender does not exist in the system' } };
    }

    if (receiver.username === sender.username) {
        return { err: { status: 400, message: 'A user cannot send a message to themselves' } };
    }

    // Validating the message
    if (!message) {
        return { err: { status: 400, message: 'The message attribute must be provided in the request body.' } };
    }

    // Create a new message and add it to the chat.
    const newMessage = new MessageModel({
        senderId: sender._id,
        receiverId: receiver._id,
        message,
    })

    if (!newMessage) {
        return { err: { status: 500, message: 'An error occurred while creating the new message' } };
    }

    // Check if the chat already exists. If not, create a new chat.
    let chat;
    try {
        chat = await ChatModel.findOneAndUpdate(
            { participants: { $all: [sender._id, receiver._id] } },
            {
                $set: { lastMessage: newMessage._id },
                $push: { messages: newMessage._id }
            },
            { new: true }
        );
    } catch (error) {
        return { err: { status: 500, message: 'An error occurred while trying to find or update the chat' } };
    }

    if (!chat) {
        try {
            chat = await ChatModel.create({
                participants: [receiver._id, sender._id],
                messages: [newMessage._id],
                lastMessage: newMessage._id,
            });
        } catch (error) {
            return { err: { status: 500, message: 'An error occurred while creating a new chat' } };
        }
    }

    let savedChat, savedMessage;
    try {
        [savedChat, savedMessage] = await Promise.all([chat.save(), newMessage.save()]);
    } catch (error) {
        return { err: { status: 500, message: 'An error occurred while saving the chat or message' } };
    }

    const receiverSocketId = getReceiverSocketId(receiver._id);
    if (receiverSocketId) {
        // io.to(<socket_id>).emit() used to send events to specific client
        io.to(receiverSocketId).emit("newMessage", savedMessage);
    }

    return { newMessage };
};



const getMessages = async (sender, receiverUsername) => {
    // Validate sender and receiver
    let receiver;
    try {
        receiver = await User.findOne({ username: receiverUsername });
    } catch (error) {
        return { err: { status: 500, message: `Error occurred while trying to find the receiver with username: ${receiverUsername}` } };
    }

    if (!sender || !receiver) {
        return { err: { status: 404, message: 'Either the sender or the receiver does not exist in the system' } };
    }

    if (sender._id.toString() === receiver._id.toString()) {
        return { err: { status: 400, message: 'A user cannot retrieve messages with themselves' } };
    }

    // Find chat
    let chat;
    try {
        chat = await ChatModel.findOne({
            participants: { $all: [sender._id, receiver._id] },
        }).populate("messages");
    } catch (error) {
        return { err: { status: 500, message: 'An error occurred while trying to find the chat between the sender and receiver' } };
    }

    if (!chat) {
        return { err: { status: 404, message: 'No chat exists between the sender and the receiver' } };
    }

    const messages = chat.messages;

    return { messages };
};



const getSideBarChats = async (loggedInUserId) => {
    let chats;
    try {
        // Find chats where the logged in user is a participant
        chats = await ChatModel.find({ participants: loggedInUserId })
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
    } catch (error) {
        return { err: { status: 500, message: 'An error occurred while trying to find the chats for the logged in user' } };
    }

    // Format chat data
    const formattedChats = chats.map((chat) => {
        const otherParticipant = chat.participants.find(
            (participant) => participant._id.toString() !== loggedInUserId.toString()
        );

        // Handle case where there might not be another participant (e.g., private message to yourself)
        if (!otherParticipant) {
            return { err: { status: 404, message: 'No other participant found in the chat' } }
        }

        const lastMessage = chat.lastMessage;
        let lastMessageSender, lastMessageText, lastMessageTimestamp;

        if (lastMessage) {
            lastMessageSender = lastMessage.senderId.toString() === loggedInUserId.toString() ? "You" : otherParticipant.username;
            lastMessageText = lastMessage.message;
            lastMessageTimestamp = lastMessage.createdAt;
        } else {
            // Set default values for empty chat
            lastMessageSender = null;
            lastMessageText = null;
            lastMessageTimestamp = null;
        }

        return {
            _id: chat._id, // Include chat ID for identification
            otherUsername: otherParticipant.username,
            lastMessageSender, // Username of the last message sender
            lastMessageText, // Text of the last message
            lastMessageTimestamp, // Timestamp of the last message
        };
    });

    const sideBarChats = formattedChats.filter(chat => chat !== null); // Remove any null values
    return { sideBarChats }
};



const reportMessage = async (messageId, reason, reportingUserId) => {
    if (!messageId || !reason || !reportingUserId) {
        return { err: { status: 400, message: 'Message ID, reason for reporting, or reporting user ID is missing' } };
    }

    // Check if the reason is valid
    const validReasons = MessageModel.schema.path('reported.reason').enumValues.map(value => value.toLowerCase());

    if (!validReasons.includes(reason.toLowerCase())) {
        return { err: { status: 400, message: `Invalid report reason. Valid reasons are: ${validReasons.join(', ')}` } };
    }

    // Find the message
    let message;
    try {
        message = await MessageModel.findOne({ _id: messageId });
    }
    catch (error) {
        return { err: { status: 500, message: `Error occurred while trying to find the message with ID: ${messageId}` } };
    }

    if (!message) {
        return { err: { status: 404, message: `No message found with the ID: ${messageId}` } };
    }

    // The receiver of the message is the only one allowed to report it.
    if (message.receiverId.toString() !== reportingUserId.toString()) {
        return { err: { status: 403, message: 'You are not the receiver of this message and hence not allowed to report it' } };
    }

    // Update the report flag and reason
    message.reported.flag = true;
    message.reported.reason = reason;

    try {
        await message.save();
    } catch (error) {
        return { err: { status: 500, message: 'Error occurred while saving the message' } };
    }

    return { successMessage: 'Message reported successfully' };
};



const removeMessage = async (messageId, removingUserId) => {
    if (!messageId) {
        return { err: { status: 400, message: 'Message ID is missing' } };
    }

    // Find the message
    let message;
    try {
        message = await MessageModel.findOne({ _id: messageId });
    } catch (error) {
        return { err: { status: 500, message: `Error occurred while trying to find the message with ID: ${messageId}` } };
    }

    if (!message) {
        return { err: { status: 404, message: `No message found with the ID: ${messageId}` } };
    }

    // The sender of the message is the only one allowed to remove it
    if (message.senderId.toString() !== removingUserId.toString()) {
        return { err: { status: 403, message: 'You are not the sender of this message and hence not allowed to remove it' } };
    }

    // Find the chat that contains the message
    let chat;
    try {
        chat = await ChatModel.findOne({ messages: messageId });
    } catch (error) {
        return { err: { status: 500, message: `Error occurred while trying to find the chat containing the message with ID: ${messageId}` } };
    }

    // If the removed message was the last message in the chat, update the last message attribute
    if (chat && chat.lastMessage.toString() === messageId) {
        const lastMessageIndex = chat.messages.findIndex(msgId => msgId.toString() === messageId);
        if (lastMessageIndex > 0) {
            chat.lastMessage = chat.messages[lastMessageIndex - 1];
        } else {
            chat.lastMessage = null;
        }
        try {
            await chat.save();
        } catch (error) {
            return { err: { status: 500, message: 'Error occurred while saving the chat' } };
        }
    }

    // Set the remove flag to true
    message.removed.flag = true;

    try {
        await message.save();
    } catch (error) {
        return { err: { status: 500, message: 'Error occurred while saving the message' } };
    }

    return { successMessage: 'Message removed successfully' };
};



export {
    sendMessage,
    getMessages,
    getSideBarChats,
    reportMessage,
    removeMessage
}