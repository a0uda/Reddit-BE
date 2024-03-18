import express from "express";
import { User } from "../db/models/User.js"; //if error put .js
import dotenv from "dotenv";
import axios from "axios";
import jwt from "jsonwebtoken";

dotenv.config();
const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REDIRECT_URI = "http://localhost:3000/users/signup-google/callback";

const CLIENT_ID_fb = process.env.FACEBOOK_CLIENT_ID;
const CLIENT_SECRET_fb = process.env.FACEBOOK_CLIENT_SECRET;
const REDIRECT_URI_fb = "http://localhost:3000/auth/facebook/callback";

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
  isUsernameAvailable,
  isEmailAvailable,
} from "../controller/userAuth.js";

import {
  getFollowers,
  getFollowing,
  getFollowersCount,
  getFollowingCount,
} from "../controller/userInfo.js";

import {
  getSafetySettings,
  getSettings,
  setSettings,
} from "../controller/userSettings.js";
import {
  blockUser,
  reportUser,
  addOrRemovePicture,
  muteCommunity,
  followUser,
  joinCommunity,
} from "../controller/userActions.js";

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
    const { success, err, user, refreshToken } = await loginUser(req.body);

    if (!success) {
      res.status(400).send(err);
      return;
    }

    // Set the token in the response header
    res.header("Authorization", `Bearer ${user.token} `);
    res.setHeader("RefreshToken", refreshToken);

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
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).send("Access Denied");
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) {
        return res.status(401).send("Access Denied: Expired token");
      }
    });

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
        display_name: userData.name,
      });
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

usersRouter.get("/available-username", async (req, res) => {
  try {
    const { success, err, status, user, msg } = await isUsernameAvailable(
      req.body.username
    );
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

usersRouter.get("/available-email", async (req, res) => {
  try {
    const { success, err, status, user, msg } = await isEmailAvailable(
      req.body.email
    );
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

usersRouter.get("/users/followers", async (req, res) => {
  try {
    const { success, err, status, users, msg } = await getFollowers(req);
    if (!success) {
      res.status(status).send(err);
      return;
    }
    res.status(200).send(users);
  } catch (error) {
    res.status(500).json({ error });
  }
});

usersRouter.get("/users/following", async (req, res) => {
  try {
    const { success, err, status, users, msg } = await getFollowing(req);
    if (!success) {
      res.status(status).send(err);
      return;
    }
    res.status(200).send(users);
  } catch (error) {
    res.status(500).json({ error });
  }
});

usersRouter.get("/users/followers-count", async (req, res) => {
  try {
    const { success, err, status, count, msg } = await getFollowersCount(req);
    console.log(success, err, status, count, msg);
    if (!success) {
      res.status(status).send(err);
      return;
    }
    res.status(200).send({ "followers-count": count });
  } catch (error) {
    res.status(500).json({ error });
  }
});

usersRouter.get("/users/following-count", async (req, res) => {
  try {
    const { success, err, status, count, msg } = await getFollowingCount(req);
    if (!success) {
      res.status(status).send(err);
      return;
    }
    res.status(200).send({ "following-count": count });
  } catch (error) {
    res.status(500).json({ error });
  }
});

usersRouter.get("/users/account-settings", async (req, res) => {
  try {
    const { success, err, status, settings, msg } = await getSettings(
      req,
      "Account"
    );
    if (!success) {
      res.status(status).send(err);
      return;
    }
    res.status(200).send(settings);
  } catch (error) {
    res.status(500).json({ error });
  }
});

usersRouter.get("/users/profile-settings", async (req, res) => {
  try {
    const { success, err, status, settings, msg } = await getSettings(
      req,
      "Profile"
    );
    if (!success) {
      res.status(status).send(err);
      return;
    }
    res.status(200).send(settings);
  } catch (error) {
    res.status(500).json({ error });
  }
});

usersRouter.get("/users/feed-settings", async (req, res) => {
  try {
    const { success, err, status, settings, msg } = await getSettings(
      req,
      "Feed"
    );
    if (!success) {
      res.status(status).send(err);
      return;
    }
    res.status(200).send(settings);
  } catch (error) {
    res.status(500).json({ error });
  }
});

usersRouter.get("/users/notification-settings", async (req, res) => {
  try {
    const { success, err, status, settings, msg } = await getSettings(
      req,
      "Notification"
    );
    if (!success) {
      res.status(status).send(err);
      return;
    }
    res.status(200).send(settings);
  } catch (error) {
    res.status(500).json({ error });
  }
});

usersRouter.get("/users/email-settings", async (req, res) => {
  try {
    const { success, err, status, settings, msg } = await getSettings(
      req,
      "Email"
    );
    if (!success) {
      res.status(status).send(err);
      return;
    }
    res.status(200).send(settings);
  } catch (error) {
    res.status(500).json({ error });
  }
});

usersRouter.get("/users/chats-and-msgs-settings", async (req, res) => {
  try {
    const { success, err, status, settings, msg } = await getSettings(
      req,
      "Chat"
    );
    if (!success) {
      res.status(status).send(err);
      return;
    }
    res.status(200).send(settings);
  } catch (error) {
    res.status(500).json({ error });
  }
});

usersRouter.get("/users/safety-settings", async (req, res) => {
  try {
    const { success, err, status, settings, msg } = await getSafetySettings(
      req
    );
    if (!success) {
      res.status(status).send(err);
      return;
    }
    res.status(200).send(settings);
  } catch (error) {
    res.status(500).json({ error });
  }
});

usersRouter.patch("/users/change-account-settings", async (req, res) => {
  try {
    const { success, err, status, msg } = await setSettings(req, "Account");
    if (!success) {
      res.status(status).send(err);
      return;
    }
    res.status(200).send(msg);
  } catch (error) {
    res.status(500).json({ error });
  }
});

usersRouter.patch("/users/change-profile-settings", async (req, res) => {
  try {
    const { success, err, status, msg } = await setSettings(req, "Profile");
    if (!success) {
      res.status(status).send(err);
      return;
    }
    res.status(200).send(msg);
  } catch (error) {
    res.status(500).json({ error });
  }
});

usersRouter.patch("/users/change-feed-settings", async (req, res) => {
  try {
    const { success, err, status, msg } = await setSettings(req, "Feed");
    if (!success) {
      res.status(status).send(err);
      return;
    }
    res.status(200).send(msg);
  } catch (error) {
    res.status(500).json({ error });
  }
});

usersRouter.patch("/users/change-notification-settings", async (req, res) => {
  try {
    const { success, err, status, msg } = await setSettings(
      req,
      "Notification"
    );
    if (!success) {
      res.status(status).send(err);
      return;
    }
    res.status(200).send(msg);
  } catch (error) {
    res.status(500).json({ error });
  }
});

usersRouter.patch("/users/change-email-settings", async (req, res) => {
  try {
    const { success, err, status, msg } = await setSettings(req, "Email");
    if (!success) {
      res.status(status).send(err);
      return;
    }
    res.status(200).send(msg);
  } catch (error) {
    res.status(500).json({ error });
  }
});

usersRouter.patch("/users/change-chats-and-msgs-settings", async (req, res) => {
  try {
    const { success, err, status, msg } = await setSettings(req, "Chat");
    if (!success) {
      res.status(status).send(err);
      return;
    }
    res.status(200).send(msg);
  } catch (error) {
    res.status(500).json({ error });
  }
});

usersRouter.post("/users/block-unblock-user", async (req, res) => {
  try {
    const result = await blockUser(req);
    res.status(result.status).json(result);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({
      success: false,
      err: "Internal Server Error",
      msg: "An error occurred while processing the request.",
    });
  }
});

usersRouter.post("/users/report-user", async (req, res) => {
  try {
    const result = await reportUser(req);
    res.status(result.status).json(result);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({
      success: false,
      err: "Internal Server Error",
      msg: "An error occurred while processing the request.",
    });
  }
});

usersRouter.post("/users/add-profile-picture", async (req, res) => {
  try {
    const result = await addOrRemovePicture(req, "profile_picture");
    res.status(result.status).json(result);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({
      success: false,
      err: "Internal Server Error",
      msg: "An error occurred while processing the request.",
    });
  }
});

usersRouter.post("/users/delete-profile-picture", async (req, res) => {
  try {
    const result = await addOrRemovePicture(req, "profile_picture", true);
    res.status(result.status).json(result);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({
      success: false,
      err: "Internal Server Error",
      msg: "An error occurred while processing the request.",
    });
  }
});

usersRouter.post("/users/add-banner-picture", async (req, res) => {
  try {
    const result = await addOrRemovePicture(req, "banner_picture");
    res.status(result.status).json(result);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({
      success: false,
      err: "Internal Server Error",
      msg: "An error occurred while processing the request.",
    });
  }
});

usersRouter.post("/users/delete-banner-picture", async (req, res) => {
  try {
    const result = await addOrRemovePicture(req, "banner_picture", true);
    res.status(result.status).json(result);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({
      success: false,
      err: "Internal Server Error",
      msg: "An error occurred while processing the request.",
    });
  }
});

usersRouter.post("/users/mute-unmute-community", async (req, res) => {
  try {
    const result = await muteCommunity(req);
    res.status(result.status).json(result);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({
      success: false,
      err: "Internal Server Error",
      msg: "An error occurred while processing the request.",
    });
  }
});

usersRouter.post("/users/follow-unfollow-user", async (req, res) => {
  try {
    const result = await followUser(req);

    res.status(result.status).json(result);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({
      success: false,
      err: "Internal Server Error",
      msg: "An error occurred while processing the request.",
    });
  }
});

usersRouter.post("/users/join-community", async (req, res) => {
  try {
    const result = await joinCommunity(req);
    res.status(result.status).json(result);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({
      success: false,
      err: "Internal Server Error",
      msg: "An error occurred while processing the request.",
    });
  }
});

usersRouter.post("/users/leave-community", async (req, res) => {
  try {
    const result = await joinCommunity(req, true);
    res.status(result.status).json(result);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({
      success: false,
      err: "Internal Server Error",
      msg: "An error occurred while processing the request.",
    });
  }
});
