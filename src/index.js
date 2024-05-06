import express from "express";
import dotenv from "dotenv";
import { usersRouter } from "./routers/users.js";
import { communityRouter } from "./routers/communityRouter.js";
import { listingPostsRouter } from "./routers/lisitng.js";
import { searchRouter } from "./routers/search.js";
import { postsRouter } from "./routers/posts.js";
import { postsOrCommentsRouter } from "./routers/postsOrComments.js";
import { notificationsRouter } from "./routers/notifications.js";
import { messageRouter } from "./routers/messageRouter.js";
import chatRouter from "./routers/chatRouter.js";
import { connect_to_db } from "./db/mongoose.js";
import { commentsRouter } from "./routers/comments.js";
import { app, server } from "./socket/socket.js";
import cors from "cors";
dotenv.config();

// const app = express();

app.use(express.json());
app.use(cors());
try {
  connect_to_db();
} catch (err) {
  console.log("Error, couldn't connect to database");
}
const port = process.env.PORT || 3001;

// Abdullah & Mido
app.use((req, res, next) => {
  res.header("Access-Control-Expose-Headers", "Authorization");
  next();
});

app.use([
  usersRouter,
  postsRouter,
  commentsRouter,
  postsOrCommentsRouter,
  listingPostsRouter,
  notificationsRouter,
  communityRouter,
  messageRouter,
  searchRouter,
  chatRouter,
]);

server.listen(port, () => {
  console.log("Server is Up on port " + port);
});

// Error handling middleware
app.use((err, req, res, next) => {
  res.status(err.status || 500);
  res.send({ err });
});
