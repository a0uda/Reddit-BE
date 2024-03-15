import express from "express";
import { User } from "../db/models/User.js";
import { Token } from "../db/models/Token.js";
import {
  signupUser,
  loginUser,
  logoutUser,
  verifyEmail,
  forgetPassword,
  resetPassword,
  forgetUsername,
  changeEmail,
  changePassword,
} from "../utils/userAuth.js";

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
    const token = request.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).send("Access Denied");
    }
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

//the front end does't directly access this api, i call it after the sign up route
usersRouter.get("/users/internal-verify-email/:token", async (req, res) => {
  console.log("TOKEN", req.params.token);
  try {
    const { success, err, status, user, msg } = await verifyEmail(
      req.params,
      true
    );
    if (!success) {
      res.status(status).send(err);
      return;
    }
    // res.status(200).send(msg);
    console.log(msg);
    res.redirect("/homepage"); //frontend
  } catch (error) {
    res.status(500).json({ error: "Internal server error." });
  }
});

// https://accounts.reddit.com/resetpassword/
// xJw7tZGUgh-MvcEJOFM7NLwTF1w?correlation_id=85f94646-62e7-4bd5-856b-c3ae5737f4ae
// &ref=password_reset
// &ref_campaign=password_reset
// &ref_source=email
// &v=QVFBQUZTcmdab09PRzBwblZUNzU2X2lkQ1ZyQ3J3V0dEME80cjFuc3A1VDV1RUJiWkRMTQ%3D%3D

//the front end does't directly access this api, i call it after the forget password route

usersRouter.get("/users/internal-forget-password/:token", async (req, res) => {
  console.log("TOKEN", req.params.token);
  try {
    const { success, err, status, user, msg } = await verifyEmail(
      req.params,
      false
    );
    if (!success) {
      res.status(status).send(err);
      return;
    }
    console.log(msg);
    res.redirect(`/resetpasswordpage/?token=${req.params.token}`); //frontend
    // res.status(200).send(msg);
  } catch (error) {
    res.status(500).json({ error: "hi Internal server error." });
  }
});

usersRouter.post("/users/forget-password", async (req, res) => {
  try {
    const { success, err, status, user, msg } = await forgetPassword(req.body);
    if (!success) {
      res.status(status).send(err);
      return;
    }
    console.log(msg);
    res.status(200).send(msg);
  } catch (error) {
    res.status(500).json({ error: "Internal server error." });
  }
});

usersRouter.post("/users/forget-username", async (req, res) => {
  try {
    const { success, err, status, user, msg } = await forgetUsername(req.body);
    if (!success) {
      res.status(status).send(err);
      return;
    }
    console.log(msg);
    res.status(200).send(msg);
  } catch (error) {
    res.status(500).json({ error: "Internal server error." });
  }
});

usersRouter.post("/users/reset-password", async (req, res) => {
  try {
    const { success, err, status, user, msg } = await resetPassword(req);
    if (!success) {
      res.status(status).send(err);
      return;
    }
    console.log(msg);
    res.status(200).send(msg);
  } catch (error) {
    res.status(500).json({ error });
  }
});

usersRouter.patch("/users/change-email", async (req, res) => {
  try {
    const { success, err, status, user, msg } = await changeEmail(req);
    if (!success) {
      res.status(status).send(err);
      return;
    }
    console.log(msg);
    res.status(200).send(msg);
  } catch (error) {
    res.status(500).json({ error });
  }
});

usersRouter.patch("/users/change-password", async (req, res) => {
  try {
    const { success, err, status, user, msg } = await changePassword(req);
    if (!success) {
      console.log("status",status);
      res.status(status).send(err);
      return;
    }
    console.log(msg);
    res.status(200).send(msg);
  } catch (error) {
    res.status(500).json({ error });
  }
});
