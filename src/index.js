import path from "path";
import express from "express";
import dotenv from "dotenv";

import { usersRouter } from "./routers/users.js";
import { postsRouter } from "./routers/posts.js";
import { commentsRouter } from "./routers/comments.js";
import { postsOrCommentsRouter } from "./routers/postsOrComments.js";
import { listingPostsRouter } from "./routers/lisitng.js";
import { notificationsRouter } from "./routers/notifications.js";

import { communityRouter } from "./routers/communityRouter.js";
import { messageRouter } from "./routers/messageRouter.js";
import chatRouter from "./routers/chatRouter.js";

import { connect_to_db } from "./db/mongoose.js";
import { app, server } from "./socket/socket.js";

dotenv.config();

// PORT should be assigned after calling dotenv.config() because we need to access the env variables.
const PORT = process.env.PORT || 3001;

app.use((req, res, next) => {
  res.header("Access-Control-Expose-Headers", "Authorization");
  next();
});

app.use(express.json()); // to parse the incoming requests with JSON payloads (from req.body)

// The Routes could user some cleaning up, for example, base URLs could be writtern here instead of inside every endpoint.
// It should look something like this app.use("/api/messages", messageRoutes);
app.use([
  usersRouter,
  postsRouter,
  commentsRouter,
  postsOrCommentsRouter,
  listingPostsRouter,
  notificationsRouter,
  communityRouter,
  messageRouter,
  chatRouter,
]);

try {
  connect_to_db();
} catch (err) {
  console.log("Error, Couldn't connect to the database.");
}

app.listen(PORT, () => {
  console.log(`Server Running on port ${PORT}`);
});

// Error handling middleware
app.use((err, req, res, next) => {
  res.status(err.status || 500);
  res.send({ err });
});

// import cors from "cors";
// const connect_to_db = require("./db/mongoose")

// const whitelist = ['http://localhost:5174', 'http://localhost:5173'];
// const corsOptions = {
//   origin: function (origin, callback) {
//     if (whitelist.indexOf(origin) !== -1) {
//       callback(null, true);
//     } else {
//       callback(new Error('Not allowed by CORS'));
//     }
//   }
// };

// app.use(cors(corsOptions));
