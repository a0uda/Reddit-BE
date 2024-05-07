import { Server } from "socket.io";
import http from "http";
import express from "express";
import { stat } from "fs";
import jwt from "jsonwebtoken";
import { User } from "../db/models/User.js";

// // This line creates a new Express application.
const app = express();

// // This line creates a new HTTP server that uses the Express application.
const server = http.createServer(app);

// // TODO: Uncomment.

const io = new Server(server, {
  path: "/socket.io",
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  },
});

// This function is exported so it can be used in other files.
// It takes a receiverId and returns the corresponding socket ID from userSocketMap.
export const getReceiverSocketId = (receiverId) => {
  return userSocketMap[receiverId];
};

// This object maps user IDs to socket IDs.
// It's used to keep track of which socket belongs to which user.
const userSocketMap = {}; // {user_id: socketId}

// This sets up an event listener for the "connection" event, which is emitted whenever a client connects to the server.
// Inside the event listener, it logs the socket ID,
// stores the socket ID in userSocketMap if the user ID is defined,
// and sets up an event listener for the "disconnect" event.
io.on("connection", async (socket) => {
  console.log("a user connected", socket.id);

  // Get the user from the procided token to fill the userSocketMap.

  // Extract the token from the query parameter.
  let token;
  if (socket.handshake.query.token) {
    token = socket.handshake.query.token.split(" ")[1];
    console.log("Token is provided");
    console.log("Token is", token);
    // rest of your code...
  } else {
    console.log("Token is not provided");
  }
  // console.log("SOCKET ISSS", socket);

  // Verify the token.
  let user_token;

  try {
    user_token = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    console.log({
      err: { status: 401, message: `Invalid Token: ${err.message}` },
    });
  }

  // Get the user id from the token.
  const user_id = user_token._id;

  // Get the user from the id.
  const user = await User.findById(user_id);

  if (!user) {
    console.log({ err: { status: 404, message: "User not found" } });
  } else {
    userSocketMap[user_id] = socket.id;
  }

  // socket.on() is used to listen to the events. can be used both on client and server side
  socket.on("disconnect", () => {
    console.log("user disconnected", socket.id);
    delete userSocketMap[user_id];
  });
});

export { app, io, server };

// // io.on:
// // This is used to set up a listener for a specific event on the Socket.IO server.
// // The listener will be called whenever that event is emitted by any client.
// // For example, io.on('connection', callback) sets up a listener for the 'connection' event,
// // which is emitted whenever a client connects to the server.

// // socket.on:
// // This is used to set up a listener for a specific event on a specific socket.
// // The listener will be called whenever that event is emitted by the client associated with that socket.
// // For example, socket.on('disconnect', callback) sets up a listener for the 'disconnect' event,
// // which is emitted when the client associated with the socket disconnects.

// // io.emit:
// // This is used to emit an event to all connected clients.

// // socket.emit:
// // This is used to emit an event to the client associated with that socket.

// // io.to.emit:
// // This is used to emit an event to all clients in a specific room.

// // socket.to.emit:
// // This is used to emit an event to all clients in a specific room, excluding the client associated with the socket.
