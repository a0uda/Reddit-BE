import express from "express";
import dotenv from "dotenv";
import { usersRouter } from "./routers/users.js";
import { communityRouter } from "./routers/communityRouter.js";
import { messageRouter } from "./routers/messageRouter.js";
import { listingPostsRouter } from "./routers/lisitng.js";
import { postsRouter } from "./routers/posts.js";
import { postsOrCommentsRouter } from "./routers/postsOrComments.js";
import { notificationsRouter } from "./routers/notifications.js";
dotenv.config();
import { connect_to_db } from "./db/mongoose.js";
import { commentsRouter } from "./routers/comments.js";
import cors from "cors";
// const connect_to_db = require("./db/mongoose")

const app = express();

app.use(express.json());

app.use(cors());


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


//Connect to database
console.log("port");
console.log(process.env.PORT);

try {
  connect_to_db();
} catch (err) {
  console.log("Error, couldn't connect to database");
}

const port = process.env.PORT;

// Abdullah & Mido
app.use((req, res, next) => {
  res.header("Access-Control-Expose-Headers", "Authorization");
  next();
});

app.listen(port, () => {
  console.log("Server is Up");
});

app.use([
  usersRouter,
  communityRouter,
  messageRouter,
  listingPostsRouter,
  postsOrCommentsRouter,
  postsRouter,
  commentsRouter,
  notificationsRouter,
]);

// Error handling middleware
app.use((err, req, res, next) => {
  res.status(err.status || 500);
  res.send({ err });
});
