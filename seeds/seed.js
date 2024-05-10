import mongoose from "mongoose";
import { seedUsers, seedUserMentions } from "./UserSeed.js";
import { seedPosts } from "./PostSeed.js";
import { seedComments } from "./CommentSeed.js";
import { seedCommunities } from "./Community.js";
import { seedNotifications } from "./NotificationSeed.js";
import { seedChatModels } from "./ChatModel.js";
import { seedMessageModels } from "./messageModelSeed.js";
import { Rule } from "../src/db/models/Rule.js";
import { connect_to_db } from "../src/db/mongoose.js";
import { dropCollections } from "./helpers/dropCollections.js";
import { seedMessages } from "./messageSeed.js";

(async function () {
  console.log("Entered");

  try {
    connect_to_db();
  } catch (err) {
    console.log("Error, couldn't connect to database");
  }

  // dropCollections();

  const users = await seedUsers();
  console.log("Finished users");
  // Seeding the communities first.
  const communities = await seedCommunities(users);
  console.log("Finished communities");
  const posts = await seedPosts(communities, users);
  console.log("Finished posts");
  const comments = await seedComments(communities, posts, users);
  console.log("Finished comments");
  seedUserMentions(users, posts, comments);
  console.log("Finished user mentions");
  const notifications = await seedNotifications(posts, comments, users);
  console.log("Finished notifications");

  const messages = await seedMessages();

  const messageModels = await seedMessageModels();
  const chatModels = await seedChatModels();

  console.log("✅ Seeds executed successfully");
  mongoose.connection.close();
})();
