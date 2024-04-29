import express from "express";
import { getMessages, sendMessage, getUsersForSidebar } from "../controller/chatController.js";
import protectRoute from "../middleware/protectRoutes.js";

const chatRouter = express.Router();

chatRouter.get("/chats/:id", protectRoute, getMessages);
chatRouter.post("/chats/send/:id", protectRoute, sendMessage);

chatRouter.get("/chats/", protectRoute, getUsersForSidebar);

export default chatRouter;