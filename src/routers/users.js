import express from "express";
import { User } from "../db/models/User.js"; //if error put .js
import { signupUser, loginUser, logoutUser } from "../utils/userAuth.js";
import session from "express-session";
import dotenv from "dotenv";
import passport from "passport";
import axios from "axios";
import { Strategy as GoogleStrategy } from "passport-google-oauth2";

dotenv.config();
const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REDIRECT_URI = "http://localhost:3000/users/signup-google/callback";

const CLIENT_ID_fb = process.env.FACEBOOK_CLIENT_ID;
const CLIENT_SECRET_fb = process.env.FACEBOOK_CLIENT_SECRET;
const REDIRECT_URI_fb = "http://localhost:3000/auth/facebook/callback";
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

usersRouter.get("/users/signup-google/callback", async (req, res) => {
  const { code } = req.query;

  try {
    const { data } = await axios.post(
      "https://oauth2.googleapis.com/token",
      null,
      {
        params: {
          client_id: CLIENT_ID,
          client_secret: CLIENT_SECRET,
          code,
          redirect_uri: REDIRECT_URI,
          grant_type: "authorization_code",
        },
      }
    );

    const accessToken = data.access_token;
    const { data: userData } = await axios.get(
      "https://www.googleapis.com/oauth2/v3/userinfo",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );
    console.log(userData);
    let user = await User.findOne({ gmail: userData.email });

    if (!user) {
      user = new User({
        username: userData.sub,
        email: userData.email,
        gmail: userData.email,
        gender: userData.gender,
        connected_google: true,
      });
      user.profile_settings = {
        display_name: userData.name,
      };
    }
    await user.generateAuthToken();
    await user.save();
    res.send(user);
  } catch (error) {
    console.error("Google OAuth error:", error.message);
    res.status(500).json({ error: "Google OAuth error" });
  }
});

usersRouter.get("/users/signup-google", (req, res) => {
  const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=code&scope=profile%20email`;
  res.redirect(url);
});

usersRouter.get("/auth/facebook/callback", async (req, res) => {
  const { code } = req.query;
  console.log(code);

  try {
    const { data } = await axios.get(
      "https://graph.facebook.com/v12.0/oauth/access_token",
      {
        params: {
          client_id: CLIENT_ID_fb,
          client_secret: CLIENT_SECRET_fb,
          redirect_uri: REDIRECT_URI_fb,
          code,
        },
      }
    );

    const accessToken = data.access_token;
    const { data: userData } = await axios.get(
      "https://graph.facebook.com/v12.0/me",
      {
        params: {
          fields: "id,name,email", // specify fields to retrieve
          access_token: accessToken,
        },
      }
    );

    let user = await User.findOne({ username: userData.id });
    console.log(user);
    console.log(userData);
    if (!user) {
      user = new User({
        username: userData.id,
        email: userData.email,
        connected_facebook: true,
      });
    }
    await user.generateAuthToken();
    await user.save();

    res.send(user);
  } catch (error) {
    console.error("Facebook OAuth error:", error.message);
    res.status(500).json({ error: "Facebook OAuth error" });
  }
});

usersRouter.get("/auth/facebook", (req, res) => {
  const url = `https://www.facebook.com/v12.0/dialog/oauth?client_id=${CLIENT_ID_fb}&redirect_uri=${REDIRECT_URI_fb}&state=email`;
  res.redirect(url);
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
      console.log("status", status);
      res.status(status).send(err);
      return;
    }
    console.log(msg);
    res.status(200).send(msg);
  } catch (error) {
    res.status(500).json({ error });
  }
});
