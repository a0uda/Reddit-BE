
import mongoose from "mongoose";
import { faker } from "@faker-js/faker";
import { Message } from "../src/db/models/Message.js";
import { User } from "../src/db/models/User.js";
import { getRandomElement, getRandomUserId } from "./seedHelpers.js";
import { Community } from "../src/db/models/Community.js";


const MESSAGES_COUNT = 1;
async function generateRandomMessages() {
    const messages = [];

    // Fetching users
    const heba = await User.findOne({ username: "heba" });
    const malak = await User.findOne({ username: "malak" });
    console.log("heba", heba);
    console.log("malak", malak);

    //heba send 3 messages to malak 
    for (let i = 0; i < MESSAGES_COUNT; i++) {
        const fakeMessage = {
            sender_id: heba._id,
            sender_via_id: null,
            sender_type: "user",
            receiver_id: malak._id,
            receiver_type: "user",
            message: faker.lorem.sentences(),
            created_at: faker.date.past(),
            subject: faker.lorem.sentence(),
            deleted_at: null,
            unread_flag: faker.datatype.boolean(),
            parent_message_id: null,
            //is invitation = true of sender_via is not null 

        };
        messages.push(fakeMessage);
    }

    //malak send 3 messages to heba
    for (let i = 0; i < MESSAGES_COUNT; i++) {
        const fakeMessage = {
            sender_id: malak._id,
            sender_via_id: null,
            sender_type: "user",
            receiver_id: heba._id,
            receiver_type: "user",
            message: faker.lorem.sentences(),
            created_at: faker.date.past(),
            subject: faker.lorem.sentence(),
            deleted_at: null,
            unread_flag: faker.datatype.boolean(),
            parent_message_id: null,
        };
        messages.push(fakeMessage);
    }

    // Finding community
    const community = await Community.findOne({ name: "Legros_LLC" });

    //heba send 3 messages to malak via community named Legros_LLC
    for (let i = 0; i < MESSAGES_COUNT; i++) {
        const fakeMessage = {
            sender_id: heba._id,
            sender_via_id: community._id,
            sender_type: "moderator",
            receiver_id: malak._id,
            receiver_type: "user",
            message: faker.lorem.sentences(),
            created_at: faker.date.past(),
            subject: faker.lorem.sentence(),
            deleted_at: null,
            unread_flag: faker.datatype.boolean(),
            parent_message_id: null,
        };
        messages.push(fakeMessage);
    }

    return messages;
}

export async function seedMessages() {
    const messages = await generateRandomMessages();
    await Message.insertMany(messages);
}
