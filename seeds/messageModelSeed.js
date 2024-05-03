import { faker } from "@faker-js/faker";
import { getRandomElement } from "./helpers/seedHelpers.js";
import { User } from "../src/db/models/User.js";
import MessageModel from "../src/db/models/MessageModel.js";

async function generateRandomMessages() {
  const messages = [];
  const users = await User.find();

  for (let i = 0; i < users.length; i++) {
    for (let j = 0; j < users.length; j++) {
      if (i === j) continue;

      const sender = users[i];
      const receiver = users[j];
      const messageCount = faker.number.int({ min: 1, max: 3 });

      for (let k = 0; k < messageCount; k++) {
        const fakeMessage = {
          senderId: sender._id,
          receiverId: receiver._id,
          message: faker.lorem.sentence(),
          createdAt: new Date(),
          reported: {
            flag: faker.datatype.boolean(),
            reason: getRandomElement([
              "Harassment",
              "Threating Violence",
              "Hate",
              "Minor abuse",
              "Sharing personal information",
              "Porhibited transaction",
              "Impersonation",
              "Copyright violation",
              "Trademark violation",
              "Delf-harm or suicide",
              "Spam",
            ]),
          },
          removed: {
            flag: faker.datatype.boolean(),
          },
        };

        messages.push(fakeMessage);
      }
    }
  }

  return messages;
}

export async function seedMessageModels() {
  const messages = await generateRandomMessages();
  const options = { timeout: 30000 }; // 30 seconds timeout
  const messagesInserted = await MessageModel.insertMany(messages, options);
  return messagesInserted;
}
