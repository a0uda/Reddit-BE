import express from "express";
import { getMessages, sendMessage, getUsersForSidebar, reportMessage } from "../controller/chatController.js";
import protectRoute from "../middleware/protectRoutes.js";

const chatRouter = express.Router();

// The receiver's username is passed in the URL.
chatRouter.post("/chats/send/:username", protectRoute, sendMessage);
// The other user's username is passed in the URL.
chatRouter.get("/chats/:username", protectRoute, getMessages);

chatRouter.get("/chats/", protectRoute, getUsersForSidebar);

// MessageID
chatRouter.post("/chats/report/:id", protectRoute, reportMessage);

export default chatRouter;