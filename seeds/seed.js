import mongoose from "mongoose";
import { seedUsers } from "./UserSeed.js";
import { seedPosts } from "./postSeed.js";
import { seedComments } from "./CommentSeed.js";
import { seedCommunities } from "./Community.js";
import { seedNotifications } from "./NotificationSeed.js";
import { seedChatModels } from "./ChatModel.js";
import { seedMessageModels } from "./messageModelSeed.js";

import { connect_to_db } from "../src/db/mongoose.js";

(async function () {
  console.log("Entered");

  try {
    connect_to_db();
  } catch (err) {
    console.log("Error, couldn't connect to database");
  }
  const users = await seedUsers();
  // Seeding the communities first.
  const communities = await seedCommunities(users);
  const posts = await seedPosts(communities, users);
  const comments = await seedComments(communities, posts, users);
  const notifications = await seedNotifications(posts, comments, users);

  // const messages = await seedMessages();

  // const messageModels = await seedMessageModels();
  // const chatModels = await seedChatModels();

  console.log("✅ Seeds executed successfully");
  mongoose.connection.close();
})();
