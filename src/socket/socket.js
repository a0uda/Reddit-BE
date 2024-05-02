import { Server } from "socket.io";
import http from "http";
import express from "express";

// This line creates a new Express application.
const app = express();

// This line creates a new HTTP server that uses the Express application.
const server = http.createServer(app);

// TODO: Uncomment.

// This line creates a new Socket.IO server that uses the HTTP server. 
// It also sets up Cross-Origin Resource Sharing (CORS) to allow requests from "http://localhost:3000" using the GET and POST methods.
const io = new Server(server, {
    cors: {
        origin: ["http://localhost:3000"],
        methods: ["GET", "POST"],
    },
});

// This function is exported so it can be used in other files. 
// It takes a receiverId and returns the corresponding socket ID from userSocketMap.
export const getReceiverSocketId = (receiverId) => {
    return userSocketMap[receiverId];
};

// This object maps user IDs to socket IDs. 
// It's used to keep track of which socket belongs to which user.
const userSocketMap = {}; // {userId: socketId}

// This sets up an event listener for the "connection" event, which is emitted whenever a client connects to the server. 
// Inside the event listener, it logs the socket ID,
// stores the socket ID in userSocketMap if the user ID is defined, 
// and sets up an event listener for the "disconnect" event.
io.on("connection", (socket) => {
    console.log("a user connected", socket.id);

    const userId = socket.handshake.query.userId;
    if (userId != "undefined") userSocketMap[userId] = socket.id;

    // socket.on() is used to listen to the events. can be used both on client and server side
    socket.on("disconnect", () => {
        console.log("user disconnected", socket.id);
        delete userSocketMap[userId];
    });
});

export { app, io, server };


// io.on:
// This is used to set up a listener for a specific event on the Socket.IO server.
// The listener will be called whenever that event is emitted by any client.
// For example, io.on('connection', callback) sets up a listener for the 'connection' event,
// which is emitted whenever a client connects to the server.

// socket.on:
// This is used to set up a listener for a specific event on a specific socket.
// The listener will be called whenever that event is emitted by the client associated with that socket.
// For example, socket.on('disconnect', callback) sets up a listener for the 'disconnect' event,
// which is emitted when the client associated with the socket disconnects.

// io.emit:
// This is used to emit an event to all connected clients.

// socket.emit:
// This is used to emit an event to the client associated with that socket.

// io.to.emit:
// This is used to emit an event to all clients in a specific room.

// socket.to.emit:
// This is used to emit an event to all clients in a specific room, excluding the client associated with the socket. 