import express from "express";
import dotenv from "dotenv";
import { usersRouter } from "./routers/users.js";
import { communityRouter } from "./routers/communities.js";
dotenv.config();
import { connect_to_db } from "./db/mongoose.js";
//const connect_to_db = require("./db/mongoose")

const app = express();

app.use(express.json());

//Connect to database
console.log("port");
console.log(process.env.PORT);

try {
  connect_to_db();
} catch (err) {
  console.log("Error, couldn't connect to database");
}

const port = process.env.PORT;

app.listen(port, () => {
  console.log("Server is Up");
});

app.use([usersRouter, communityRouter]);

// Error handling middleware
app.use((err, req, res, next) => {
  res.status(err.status || 500);
  res.send(err.message);
});
