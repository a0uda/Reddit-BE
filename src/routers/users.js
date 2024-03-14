import express from "express";
import { User } from "../db/models/User.js";
import { Token } from "../db/models/Token.js";
import { signupUser, loginUser, logoutUser } from "../utils/userAuth.js";

export const usersRouter = express.Router();

usersRouter.post("/users/signup", async (req, res) => {
  try {
    const { success, err, user } = await signupUser(req.body);

    if (!success) {
      res.status(400).send(err);
      return;
    }

    res.header("Authorization", `Bearer ${user.token}`);

    res.status(201).send({ username: user.username });
  } catch (error) {
    res.status(500).json({ error: "Internal server error." });
  }
  return;
});

usersRouter.post("/users/login", async (req, res) => {
  try {
    const { success, err, user } = await loginUser(req.body);

    if (!success) {
      res.status(400).send(err);
      return;
    }

    // Set the token in the response header
    res.header("Authorization", `Bearer ${user.token}`);

    // Send a response without the token in the body
    res.status(200).send({ username: user.username });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal server error." });
  }
  return;
});

usersRouter.post("/users/logout", async (req, res) => {
  try {
    const token = req.headers.authorization.split(" ")[1];
    const { username } = req.body;

    const { success, msg, err } = await logoutUser({ token, username });

    if (!success) {
      res.status(400).send(err);
      return;
    }

    res.status(200).send(msg);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal server error." });
  }
});

usersRouter.get("/users/verify-email/:token", async (req, res) => {
  console.log("TOKEN",req.params.token)
  try {
    const token = await Token.findOne({
      token: req.params.token,
    });
    //check if token exists
    if (!token) return res.status(404).send("Token not found");
    //check if token is't expired
    if (token.expires_at < Date.now())
      return res.status(400).send("Token has expired");
    await User.updateOne(
      { _id: token.user_id },
      { $set: { verified_email_flag: true } }
    );
    await Token.findByIdAndDelete(token._id);
    res.status(200).send("Email is verified");
  } catch (error) {
    return res.status(400).send(error);
  }
});
