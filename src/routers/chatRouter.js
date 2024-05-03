import express from "express";
import protectRoute from "../middleware/protectRoutes.js";

import {
    sendMessageController,
    getMessagesController,
    getSideBarChatsController,
    reportMessageController,
    removeMessageController
} from "../controller/chatController.js";

const chatRouter = express.Router();

// The receiver's username is passed in the URL.
chatRouter.post("/chats/send/:username", protectRoute, sendMessageController);
// The other user's username is passed in the URL.
// Used to get all messages between the logged in user and the other user.
chatRouter.get("/chats/:username", protectRoute, getMessagesController);
// Get all users that the logged in user has chatted with (all the details to be displayed).
chatRouter.get("/chats/", protectRoute, getSideBarChatsController);
// The message ID is passed in the URL.
// The receiver of the message is the logged in user.
chatRouter.post("/chats/report/:id", protectRoute, reportMessageController);
// The message ID is passed in the URL.
// The receiver of the message is the logged in user.
chatRouter.post("/chats/remove/:id", protectRoute, removeMessageController);

export default chatRouter;