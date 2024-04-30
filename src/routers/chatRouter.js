import express from "express";
import { getMessages, sendMessage, getUsersForSidebar, reportMessage, removeMessage } from "../controller/chatController.js";
import protectRoute from "../middleware/protectRoutes.js";

const chatRouter = express.Router();

// The receiver's username is passed in the URL.
chatRouter.post("/chats/send/:username", protectRoute, sendMessage);
// The other user's username is passed in the URL.
// Used to get all messages between the logged in user and the other user.
chatRouter.get("/chats/:username", protectRoute, getMessages);
// Get all users that the logged in user has chatted with (all the details to be displayed).
chatRouter.get("/chats/", protectRoute, getUsersForSidebar);
// The message ID is passed in the URL.
// The receiver of the message is the logged in user.
chatRouter.post("/chats/report/:id", protectRoute, reportMessage);
// The message ID is passed in the URL.
// The receiver of the message is the logged in user.
chatRouter.post("/chats/remove/:id", protectRoute, removeMessage);

export default chatRouter;