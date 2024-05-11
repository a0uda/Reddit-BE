import express from "express";
import { User } from "../db/models/User.js";
import dotenv from "dotenv";
import axios from "axios";
import jwt from "jsonwebtoken";
import { redirectToVerifyEmail } from "../utils/emailSending.js";
import { verifyAuthToken } from "../controller/userAuth.js";

dotenv.config();
const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REDIRECT_URI =
  "https://redditech.me/backend/users/signup-google/callback";
// DEVOPS
const CLIENT_ID_fb = process.env.FACEBOOK_CLIENT_ID;
const CLIENT_SECRET_fb = process.env.FACEBOOK_CLIENT_SECRET;
const REDIRECT_URI_fb = "https://redditech.me/auth/facebook/callback";
// DEVOPS

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
  changeUsername,
  disconnectGoogle,
  connectToGoogle,
} from "../controller/userAuth.js";

import {
  getFollowers,
  getFollowing,
  getFollowersCount,
  getFollowingCount,
  getPosts,
  getOverview,
  getAbout,
  getAllSavedComments,
  getAllSavedPosts,
  getComments,
  getCommunities,
  getUserPosts,
  getUserComments,
  getBlockedUsers,
  getMutedCommunities,
  getActiveCommunities,
} from "../controller/userInfo.js";

import {
  addSocialLink,
  deleteSocialLink,
  editSocialLink,
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
  favoriteCommunity,
  clearHistory,
  deleteAccount,
  hidePost,
  followPost,
} from "../controller/userActions.js";

export const usersRouter = express.Router();

usersRouter.post("/users/signup", async (req, res) => {
  try {
    const { success, error, message, user } = await signupUser(req.body);
    if (!success) {
      res.status(error.status).send({ error });
      return;
    }
    res.header("Authorization", `Bearer ${user.token}`);

    res.status(201).send({ message });
  } catch (e) {
    res
      .status(500)
      .send({ error: { status: 500, message: "Internal server error." } });
  }
});

usersRouter.post("/users/login", async (req, res) => {
  try {
    const { success, error, message, user, token } = await loginUser(req.body);
    if (!success) {
      res.status(error.status).send({ error });
      return;
    }
    // Set the token in the response header
    res.header("Authorization", `Bearer ${token} `);
    // res.setHeader("RefreshToken", refreshToken);

    res.status(200).send({ message });
  } catch (e) {
    console.log(e);
    res
      .status(500)
      .send({ error: { status: 500, message: "Internal server error." } });
  }
});

usersRouter.post("/users/logout", async (req, res) => {
  try {
    const { success, message, error } = await logoutUser(req);

    if (!success) {
      res.status(error.status).send({ error });
      return;
    }
    res.status(200).send({ message });
  } catch (error) {
    res
      .status(500)
      .send({ error: { status: 500, message: "Internal server error." } });
  }
});
usersRouter.post("/users/connect-to-google", async (req, res) => {
  try {
    const { success, error, message } = await connectToGoogle(req);
    if (!success) {
      res.status(error.status).send({ error });
      return;
    }
    res.status(200).send({ message });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

usersRouter.post("/users/disconnect-google", async (req, res) => {
  try {
    const { success, error, message } = await disconnectGoogle(req);
    if (!success) {
      res.status(error.status).send({ error });
      return;
    }
    res.status(200).send({ message });
  } catch (error) {
    res.status(500).json({ error: "Google OAuth error" });
  }
});

usersRouter.post("/users/signup-google", async (req, res) => {
  try {
    const accessToken = req.body.access_token;
    const { data: userData } = await axios.get(
      "https://www.googleapis.com/oauth2/v3/userinfo",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );
    // console.log(userData);
    let user = await User.findOne({ gmail: userData.email });

    if (!user) {
      user = new User({
        username: userData.sub,
        email: userData.email,
        gmail: userData.email,
        gender: userData.gender,
        connected_google: true,
        display_name: userData.name,
        is_password_set_flag: false,
      });
    }
    const refreshToken = await user.generateAuthToken();
    const token = await user.generateAuthToken();
    user.connected_google = true;
    const savedUser = await user.save();
    res.header("Authorization", `Bearer ${token} `);
    res.setHeader("RefreshToken", refreshToken);
    //send verification email to user
    await redirectToVerifyEmail(savedUser._id, user.email);
    res.status(200).send({ username: user.username });
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
        is_password_set_flag: false,
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
    const username = req?.body?.username;
    if (!username) {
      res.status(400).send({
        error: {
          status: 400,
          message: "Username is required",
        },
      });
      return;
    }
    const { success, error, message } = await isUsernameAvailable(username);
    if (!success) {
      res.status(error.status).send({ error });
      return;
    }
    res.status(200).send({ message });
  } catch (e) {
    res
      .status(500)
      .send({ error: { status: 500, message: "Internal server error." } });
  }
});

usersRouter.get("/available-email", async (req, res) => {
  try {
    const email = req?.body?.email;
    if (!email) {
      res.status(400).send({
        error: {
          status: 400,
          message: "Email is required",
        },
      });
      return;
    }
    const { success, error, message } = await isEmailAvailable(email);
    if (!success) {
      res.status(error.status).send({ error });
      return;
    }
    res.status(200).send({ message });
  } catch (e) {
    res
      .status(500)
      .send({ error: { status: 500, message: "Internal server error." } });
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
    res.redirect("https://redditech.me"); //frontend
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
    res.redirect(`https://redditech.me/resetpassword/:${req.params.token}`); //frontend
    // res.status(200).send(msg);
  } catch (error) {
    res.status(500).json({ error: "hi Internal server error." });
  }
});

usersRouter.post("/users/forget-password", async (req, res) => {
  try {
    const { success, error, message } = await forgetPassword(req.body);
    if (!success) {
      res.status(error.status).send({ error });
      return;
    }
    res.status(200).send({ message });
  } catch (e) {
    res
      .status(500)
      .send({ error: { status: 500, message: "Internal server error." } });
  }
});

usersRouter.post("/users/forget-username", async (req, res) => {
  try {
    const { success, error, message } = await forgetUsername(req.body);
    if (!success) {
      res.status(error.status).send({ error });
      return;
    }
    res.status(200).send({ message });
  } catch (e) {
    res
      .status(500)
      .send({ error: { status: 500, message: "Internal server error." } });
  }
});

usersRouter.post("/users/reset-password", async (req, res) => {
  try {
    const { success, error, message } = await resetPassword(req);
    if (!success) {
      res.status(error.status).send({ error });
      return;
    }
    res.status(200).send({ message });
  } catch (e) {
    res
      .status(500)
      .send({ error: { status: 500, message: "Internal server error." } });
  }
});

usersRouter.patch("/users/change-email", async (req, res) => {
  try {
    const { success, error, message } = await changeEmail(req);
    if (!success) {
      res.status(error.status).send({ error });
      return;
    }
    res.status(200).send({ message });
  } catch (e) {
    res
      .status(500)
      .send({ error: { status: 500, message: "Internal server error." } });
  }
});

//This endpoint is used only once when the user signs up with google he
//can change the generated random username only once
usersRouter.patch("/users/change-username", async (req, res) => {
  try {
    const { success, error, message } = await changeUsername(req);
    if (!success) {
      res.status(error.status).send({ error });
      return;
    }
    res.status(200).send({ message });
  } catch (e) {
    res
      .status(500)
      .send({ error: { status: 500, message: "Internal server error." } });
  }
});

usersRouter.patch("/users/change-password", async (req, res) => {
  try {
    const { success, error, message } = await changePassword(req);
    if (!success) {
      res.status(error.status).send({ error });
      return;
    }
    res.status(200).send({ message });
  } catch (e) {
    res
      .status(500)
      .send({ error: { status: 500, message: "Internal server error." } });
  }
});

usersRouter.get("/users/followers", async (req, res) => {
  try {
    const { success, error, message, users } = await getFollowers(req);
    if (!success) {
      res.status(error.status).send({ error });
      return;
    }
    res.status(200).send({ message, content: users });
  } catch (e) {
    res
      .status(500)
      .send({ error: { status: 500, message: "Internal server error." } });
  }
});

usersRouter.get("/users/following", async (req, res) => {
  try {
    const { success, error, message, users } = await getFollowing(req);
    if (!success) {
      res.status(error.status).send({ error });
      return;
    }
    res.status(200).send({ message, content: users });
  } catch (e) {
    res
      .status(500)
      .send({ error: { status: 500, message: "Internal server error." } });
  }
});

usersRouter.get("/users/followers-count", async (req, res) => {
  try {
    const { success, error, message, count } = await getFollowersCount(req);
    if (!success) {
      res.status(error.status).send({ error });
      return;
    }
    res.status(200).send({ message, content: count });
  } catch (e) {
    res
      .status(500)
      .send({ error: { status: 500, message: "Internal server error." } });
  }
});

usersRouter.get("/users/following-count", async (req, res) => {
  try {
    const { success, error, message, count } = await getFollowingCount(req);
    if (!success) {
      res.status(error.status).send({ error });
      return;
    }
    res.status(200).send({ message, content: count });
  } catch (e) {
    res
      .status(500)
      .send({ error: { status: 500, message: "Internal server error." } });
  }
});

usersRouter.get("/users/about/:username", async (req, res) => {
  try {
    const { success, error, message, about } = await getAbout(req);
    if (!success) {
      res.status(error.status).send({ error });
      return;
    }
    res.status(200).send({ message, content: about });
  } catch (e) {
    res
      .status(500)
      .send({ error: { status: 500, message: "Internal server error." } });
  }
});

usersRouter.get("/users/overview/:username", async (req, res) => {
  try {
    const { page = 1, pageSize = 10, sortBy = "New" } = req.query;
    const pageNumber = parseInt(page);
    const pageSizee = parseInt(pageSize);
    const { success, error, message, content } = await getOverview(
      req,
      pageNumber,
      pageSizee,
      sortBy
    );
    if (!success) {
      res.status(error.status).send({ error });
      return;
    }
    res.status(200).send({ message, content });
  } catch (e) {
    res
      .status(500)
      .send({ error: { status: 500, message: "Internal server error." } });
  }
});

usersRouter.get("/users/account-settings", async (req, res) => {
  try {
    const { success, error, message, settings } = await getSettings(
      req,
      "Account"
    );
    if (!success) {
      res.status(error.status).send({ error });
      return;
    }
    res.status(200).send({ message, content: settings.account_settings });
  } catch (e) {
    res
      .status(500)
      .send({ error: { status: 500, message: "Internal server error." } });
  }
});

usersRouter.get("/users/profile-settings", async (req, res) => {
  try {
    const { success, error, message, settings } = await getSettings(
      req,
      "Profile"
    );
    if (!success) {
      res.status(error.status).send({ error });
      return;
    }
    res.status(200).send({ message, content: settings.profile_settings });
  } catch (e) {
    res
      .status(500)
      .send({ error: { status: 500, message: "Internal server error." } });
  }
});

usersRouter.post("/users/add-social-link", async (req, res) => {
  try {
    const { success, error, message } = await addSocialLink(req);
    if (!success) {
      res.status(error.status).send({ error });
      return;
    }
    res.status(200).send({ message });
  } catch (e) {
    res
      .status(500)
      .send({ error: { status: 500, message: "Internal server error." } });
  }
});

usersRouter.post("/users/delete-social-link", async (req, res) => {
  try {
    const { success, error, message } = await deleteSocialLink(req);
    if (!success) {
      res.status(error.status).send({ error });
      return;
    }
    res.status(200).send({ message });
  } catch (e) {
    res
      .status(500)
      .send({ error: { status: 500, message: "Internal server error." } });
  }
});

usersRouter.patch("/users/edit-social-link", async (req, res) => {
  try {
    const { success, error, message } = await editSocialLink(req);
    if (!success) {
      res.status(error.status).send({ error });
      return;
    }
    res.status(200).send({ message });
  } catch (e) {
    res
      .status(500)
      .send({ error: { status: 500, message: "Internal server error." } });
  }
});

usersRouter.get("/users/feed-settings", async (req, res) => {
  try {
    const { success, error, message, settings } = await getSettings(
      req,
      "Feed"
    );
    if (!success) {
      res.status(error.status).send({ error });
      return;
    }
    res.status(200).send({ message, content: settings.feed_settings });
  } catch (e) {
    res
      .status(500)
      .send({ error: { status: 500, message: "Internal server error." } });
  }
});

usersRouter.get("/users/notification-settings", async (req, res) => {
  try {
    const { success, error, message, settings } = await getSettings(
      req,
      "Notification"
    );
    if (!success) {
      res.status(error.status).send({ error });
      return;
    }
    res.status(200).send({ message, content: settings.notifications_settings });
  } catch (e) {
    res
      .status(500)
      .send({ error: { status: 500, message: "Internal server error." } });
  }
});

usersRouter.get("/users/email-settings", async (req, res) => {
  try {
    const { success, error, message, settings } = await getSettings(
      req,
      "Email"
    );
    if (!success) {
      res.status(error.status).send({ error });
      return;
    }
    res.status(200).send({ message, content: settings.email_settings });
  } catch (e) {
    res
      .status(500)
      .send({ error: { status: 500, message: "Internal server error." } });
  }
});

usersRouter.get("/users/chats-and-msgs-settings", async (req, res) => {
  try {
    const { success, error, message, settings } = await getSettings(
      req,
      "Chat"
    );
    if (!success) {
      res.status(error.status).send({ error });
      return;
    }
    res
      .status(200)
      .send({ message, content: settings.chat_and_messaging_settings });
  } catch (e) {
    res
      .status(500)
      .send({ error: { status: 500, message: "Internal server error." } });
  }
});

usersRouter.get("/users/safety-settings", async (req, res) => {
  try {
    const { success, error, message, settings } = await getSafetySettings(req);
    if (!success) {
      res.status(error.status).send({ error });
      return;
    }
    res.status(200).send({ message, content: settings });
  } catch (e) {
    res
      .status(500)
      .send({ error: { status: 500, message: "Internal server error." } });
  }
});

usersRouter.patch("/users/change-account-settings", async (req, res) => {
  try {
    const { success, error, message } = await setSettings(req, "Account");
    if (!success) {
      res.status(error.status).send({ error });
      return;
    }
    res.status(200).send({ message });
  } catch (e) {
    res
      .status(500)
      .send({ error: { status: 500, message: "Internal server error." } });
  }
});

usersRouter.patch("/users/change-profile-settings", async (req, res) => {
  try {
    const { success, error, message } = await setSettings(req, "Profile");
    if (!success) {
      res.status(error.status).send({ error });
      return;
    }
    res.status(200).send({ message });
  } catch (e) {
    res
      .status(500)
      .send({ error: { status: 500, message: "Internal server error." } });
  }
});

usersRouter.patch("/users/change-feed-settings", async (req, res) => {
  try {
    const { success, error, message } = await setSettings(req, "Feed");
    if (!success) {
      res.status(error.status).send({ error });
      return;
    }
    res.status(200).send({ message });
  } catch (e) {
    res
      .status(500)
      .send({ error: { status: 500, message: "Internal server error." } });
  }
});

usersRouter.patch("/users/change-notification-settings", async (req, res) => {
  try {
    const { success, error, message } = await setSettings(req, "Notification");
    if (!success) {
      res.status(error.status).send({ error });
      return;
    }
    res.status(200).send({ message });
  } catch (e) {
    res
      .status(500)
      .send({ error: { status: 500, message: "Internal server error." } });
  }
});

usersRouter.patch("/users/change-email-settings", async (req, res) => {
  try {
    const { success, error, message } = await setSettings(req, "Email");
    if (!success) {
      res.status(error.status).send({ error });
      return;
    }
    res.status(200).send({ message });
  } catch (e) {
    res
      .status(500)
      .send({ error: { status: 500, message: "Internal server error." } });
  }
});

usersRouter.patch("/users/change-chats-and-msgs-settings", async (req, res) => {
  try {
    const { success, error, message } = await setSettings(req, "Chat");
    if (!success) {
      res.status(error.status).send({ error });
      return;
    }
    res.status(200).send({ message });
  } catch (e) {
    res
      .status(500)
      .send({ error: { status: 500, message: "Internal server error." } });
  }
});

usersRouter.post("/users/block-unblock-user", async (req, res) => {
  try {
    const result = await blockUser(req);
    res.status(result.status).json(result);
  } catch (error) {
    //console.error("Error:", error);
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
    //console.error("Error:", error);
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
    //console.error("Error:", error);
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
    //console.error("Error:", error);
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
    //console.error("Error:", error);
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
    //console.error("Error:", error);
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
    //console.error("Error:", error);
    res.status(500).json({
      success: false,
      err: "Internal Server Error",
      msg: "An error occurred while processing the request.",
    });
  }
});

usersRouter.patch("/users/favorite-unfavorite-community", async (req, res) => {
  try {
    const { success, error, message } = await favoriteCommunity(req);
    if (!success) {
      res.status(error.status).send({ error });
      return;
    }
    res.status(200).send({ message });
  } catch (e) {
    res
      .status(500)
      .send({ error: { status: 500, message: "Internal server error." } });
  }
});

usersRouter.post("/users/follow-unfollow-user", async (req, res) => {
  try {
    const result = await followUser(req);

    res.status(result.status).json(result);
  } catch (error) {
    //console.error("Error:", error);
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
    //console.error("Error:", error);
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
    //console.error("Error:", error);
    res.status(500).json({
      success: false,
      err: "Internal Server Error",
      msg: "An error occurred while processing the request.",
    });
  }
});

usersRouter.get("/users/posts/:username", async (req, res) => {
  try {
    const { page = 1, pageSize = 10, sortBy = "New" } = req.query;
    const pageNumber = parseInt(page);
    const pageSizee = parseInt(pageSize);

    const result = await getUserPosts(req, pageNumber, pageSizee, sortBy);
    res.status(result.status).json(result);
  } catch (error) {
    //console.error("Error:", error);
    res.status(500).json({
      success: false,
      err: "Internal Server Error",
      msg: "An error occurred while processing the request.",
    });
  }
});

usersRouter.get("/users/upvoted-posts", async (req, res) => {
  try {
    const { page = 1, pageSize = 10, sortBy = "New" } = req.query;
    const pageNumber = parseInt(page);
    const pageSizee = parseInt(pageSize);
    const result = await getPosts(
      req,
      "upvotes_posts_ids",
      pageNumber,
      pageSizee,
      sortBy
    );
    res.status(result.status).json(result);
  } catch (error) {
    //console.error("Error:", error);
    res.status(500).json({
      success: false,
      err: "Internal Server Error",
      msg: "An error occurred while processing the request.",
    });
  }
});

usersRouter.get("/users/downvoted-posts", async (req, res) => {
  try {
    const { page = 1, pageSize = 10, sortBy = "New" } = req.query;
    const pageNumber = parseInt(page);
    const pageSizee = parseInt(pageSize);
    const result = await getPosts(
      req,
      "downvotes_posts_ids",
      pageNumber,
      pageSizee,
      sortBy
    );
    res.status(result.status).json(result);
  } catch (error) {
    //console.error("Error:", error);
    res.status(500).json({
      success: false,
      err: "Internal Server Error",
      msg: "An error occurred while processing the request.",
    });
  }
});

usersRouter.get("/users/history-posts", async (req, res) => {
  try {
    const { page = 1, pageSize = 10, sortBy = "New" } = req.query;
    const pageNumber = parseInt(page);
    const pageSizee = parseInt(pageSize);
    const result = await getPosts(
      req,
      "history_posts_ids",
      pageNumber,
      pageSizee,
      sortBy
    );
    res.status(result.status).json(result);
  } catch (error) {
    //console.error("Error:", error);
    res.status(500).json({
      success: false,
      err: "Internal Server Error",
      msg: "An error occurred while processing the request.",
    });
  }
});

usersRouter.get("/users/hidden-and-reported-posts", async (req, res) => {
  try {
    const { page = 1, pageSize = 10, sortBy = "New" } = req.query;
    const pageNumber = parseInt(page);
    const pageSizee = parseInt(pageSize);
    const result = await getPosts(
      req,
      "hidden_and_reported_posts_ids",
      pageNumber,
      pageSizee,
      sortBy
    );
    res.status(result.status).json(result);
  } catch (error) {
    //console.error("Error:", error);
    res.status(500).json({
      success: false,
      err: "Internal Server Error",
      msg: "An error occurred while processing the request.",
    });
  }
});

usersRouter.get("/users/comments/:username", async (req, res) => {
  try {
    const { page = 1, pageSize = 10, sortBy = "New" } = req.query;
    const pageNumber = parseInt(page);
    const pageSizee = parseInt(pageSize);
    const result = await getUserComments(req, pageNumber, pageSizee, sortBy);
    res.status(result.status).json(result);
  } catch (error) {
    //console.error("Error:", error);
    res.status(500).json({
      success: false,
      err: "Internal Server Error",
      msg: "An error occurred while processing the request.",
    });
  }
});

usersRouter.get("/users/saved-posts-and-comments", async (req, res) => {
  try {
    const rposts = await getAllSavedPosts(req);
    const rcomments = await getAllSavedComments(req);
    const result = {
      success: rposts.success,
      status: rposts.status,
      content: { posts: rposts.content, comments: rcomments.content },
    };

    res.status(rposts.status).json(result);
  } catch (error) {
    //console.error("Error:", error);
    res.status(500).json({
      success: false,
      err: "Internal Server Error",
      msg: "An error occurred while processing the request.",
    });
  }
});

usersRouter.get("/users/saved-posts", async (req, res) => {
  try {
    const { page = 1, pageSize = 10, sortBy = "New" } = req.query;
    const pageNumber = parseInt(page);
    const pageSizee = parseInt(pageSize);
    const result = await getPosts(
      req,
      "saved_posts_ids",
      pageNumber,
      pageSizee,
      sortBy
    );

    res.status(result.status).json(result);
  } catch (error) {
    //console.error("Error:", error);
    res.status(500).json({
      success: false,
      err: "Internal Server Error",
      msg: "An error occurred while processing the request.",
    });
  }
});

usersRouter.get("/users/saved-comments", async (req, res) => {
  try {
    const { page = 1, pageSize = 10, sortBy = "New" } = req.query;
    const pageNumber = parseInt(page);
    const pageSizee = parseInt(pageSize);
    const result = await getComments(
      req,
      "saved_comments_ids",
      pageNumber,
      pageSizee,
      sortBy
    );
    res.status(result.status).json(result);
  } catch (error) {
    //console.error("Error:", error);
    res.status(500).json({
      success: false,
      err: "Internal Server Error",
      msg: "An error occurred while processing the request.",
    });
  }
});

usersRouter.get("/users/communities", async (req, res) => {
  try {
    const result = await getCommunities(req, "");
    res.status(result.status).json(result);
  } catch (error) {
    //console.error("Error:", error);
    res.status(500).json({
      success: false,
      err: "Internal Server Error",
      msg: "An error occurred while processing the request.",
    });
  }
});

usersRouter.get("/users/moderated-communities", async (req, res) => {
  try {
    const result = await getCommunities(req, "moderated");
    res.status(result.status).json(result);
  } catch (error) {
    //console.error("Error:", error);
    res.status(500).json({
      success: false,
      err: "Internal Server Error",
      msg: "An error occurred while processing the request.",
    });
  }
});

usersRouter.post("/users/clear-history", async (req, res) => {
  try {
    const result = await clearHistory(req);
    res.status(result.status).json(result);
  } catch (error) {
    //console.error("Error:", error);
    res.status(500).json({
      success: false,
      err: "Internal Server Error",
      msg: "An error occurred while processing the request.",
    });
  }
});

usersRouter.post("/users/delete-account", async (req, res) => {
  try {
    const result = await deleteAccount(req);
    res.status(result.status).json(result);
  } catch (error) {
    //console.error("Error:", error);
    res.status(500).json({
      success: false,
      err: "Internal Server Error",
      msg: "An error occurred while processing the request.",
    });
  }
});

usersRouter.post("/users/follow-unfollow-post", async (req, res) => {
  try {
    const { success, error, message } = await followPost(req);
    if (!success) {
      res.status(error.status).send({ error });
      return;
    }
    res.status(200).send({ message });
  } catch (e) {
    res.status(500).send({ error: e });
  }
});

usersRouter.post("/users/hide-unhide-post", async (req, res) => {
  try {
    const { success, error, message } = await hidePost(req);
    if (!success) {
      res.status(error.status).send({ error });
      return;
    }
    res.status(200).send({ message });
  } catch (e) {
    res.status(500).send({ error: e });
  }
});

usersRouter.get("/users/blocked-users", async (req, res) => {
  try {
    const result = await getBlockedUsers(req);
    res.status(result.status).json(result);
  } catch (error) {
    //console.error("Error:", error);
    res.status(500).json({
      success: false,
      err: "Internal Server Error",
      msg: "An error occurred while processing the request.",
    });
  }
});

usersRouter.get("/users/muted-communities", async (req, res) => {
  try {
    const result = await getMutedCommunities(req);
    res.status(result.status).json(result);
  } catch (error) {
    //console.error("Error:", error);
    res.status(500).json({
      success: false,
      err: "Internal Server Error",
      msg: "An error occurred while processing the request.",
    });
  }
});

usersRouter.get("/users/active-communities", async (req, res) => {
  try {
    const result = await getActiveCommunities(req);
    res.status(result.status).json(result);
  } catch (error) {
    //console.error("Error:", error);
    res.status(500).json({
      success: false,
      err: "Internal Server Error",
      msg: "An error occurred while processing the request.",
    });
  }
});
