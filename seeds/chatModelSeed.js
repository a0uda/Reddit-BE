import { faker } from "@faker-js/faker";
import { getRandomElement } from "./seedHelpers.js";
import { User } from '../src/db/models/User.js';
import MessageModel from '../src/db/models/MessageModel.js';
import ChatModel from '../src/db/models/ChatModel.js';

const CHAT_COUNT = 50;

async function generateRandomChats() {
    const chats = [];
    const users = await User.find();
    const messages = await MessageModel.find();

    for (let i = 0; i < users.length; i++) {
        for (let j = 0; j < users.length; j++) {
            
            if (i === j) continue;

            const sender = users[i];
            const receiver = users[j];
            const chatMessages = messages.filter(message =>
                (message.senderId.toString() === sender._id.toString() && message.receiverId.toString() === receiver._id.toString()) ||
                (message.senderId.toString() === receiver._id.toString() && message.receiverId.toString() === sender._id.toString())
            );
            const validChatMessages = chatMessages.filter(message => !message.removed.flag);
            const lastMessage = validChatMessages.sort((a, b) => b.createdAt - a.createdAt)[0];
            const fakeChat = {
                participants: [sender._id, receiver._id],
                messages: chatMessages.map(message => message._id),
                lastMessage: lastMessage ? lastMessage._id : null
            };

            chats.push(fakeChat);
        }
    }

    return chats;
}

export async function seedChatModels() {
    const chats = await generateRandomChats();
    const options = { timeout: 30000 }; // 30 seconds timeout
    const chatsInserted = await ChatModel.insertMany(chats, options);
    return chatsInserted;
}