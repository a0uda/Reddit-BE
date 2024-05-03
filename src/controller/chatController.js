import {
	sendMessage,
	getMessages,
	getSideBarChats,
	reportMessage,
	removeMessage
} from "../services/chatService.js";

export const sendMessageController = async (req, res, next) => {
	try {
		const { message } = req.body;
		const { username: receiverUsername } = req.params;
		const sender = req.user;

		const { err, newMessage } = await sendMessage(sender, receiverUsername, message);
		
		if (err) { return next(err) }

		return res.status(201).send(newMessage);
	} catch (error) {
		next(error);
	}
};


export const getMessagesController = async (req, res, next) => {
	try {
		const { username: receiverUsername } = req.params;
		const sender = req.user;

		const { err, messages } = await getMessages(sender, receiverUsername);

		if (err) { return next(err) }

		return res.status(200).send(messages);
	} catch (error) {
		next(error);
	}
};


export const getSideBarChatsController = async (req, res, next) => {
	try {
		const loggedInUserId = req.user._id;

		const { err, sideBarChats } = await getSideBarChats(loggedInUserId);

		if (err) { return next(err) }

		return res.status(200).send(sideBarChats);
	} catch (error) {
		next(error);
	}
};

export const reportMessageController = async (req, res, next) => {
	try {
		const { id: messageId } = req.params;
		const { reason } = req.body;
		const reportingUserId = req.user._id;

		const { err, successMessage } = await reportMessage(messageId, reason, reportingUserId);

		if (err) { return next(err) }

		return res.status(200).send({ message: successMessage });
	} catch (error) {
		next(error);
	}
};


export const removeMessageController = async (req, res, next) => {
	try {
		const { id: messageId } = req.params;
		const removingUserId = req.user._id;

		const { err, successMessage } = await removeMessage(messageId, removingUserId);

		if (err) { return next(err) }

		return res.status(200).send({ message: successMessage });
	} catch (error) {
		next(error);
	}
};