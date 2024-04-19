import express from "express";
import { User } from "../db/models/User.js"; //if error put .js
import { Post } from "../db/models/Post.js";
import dotenv from "dotenv";
import axios from "axios";
import jwt from "jsonwebtoken";

import {
  postToggler,
  editPostDescription,
  postVote,
  postSave,
  postApprove,
  postRemove,
  postReport,
  postDelete,
} from "../controller/posts.js";
import {
  commentToggler,
  editCommentDescription,
  commentVote,
  commentSave,
  commentApprove,
  commentRemove,
  commentReport,
  commentDelete,
} from "../controller/comments.js";

export const postsOrCommentsRouter = express.Router();

postsOrCommentsRouter.patch("/posts-or-comments/spoiler", async (req, res) => {
  try {
    let togglerFunction;
    let targetType;

    // Determine whether to toggle a post or a comment based on the request

    if (req.body.is_post) {
      togglerFunction = postToggler;
      targetType = "post";
    } else {
      togglerFunction = commentToggler;
      targetType = "comment";
    }

    // Toggle the spoiler_flag using the appropriate function
    const { success, err, status, msg } = await togglerFunction(
      req,
      "spoiler_flag"
    );

    // Check if the toggle operation was successful
    if (!success) {
      // If not successful, send an error response
      return res.status(status).json({ success, error: err, message: msg });
    }

    // If successful, send a success response
    return res.status(200).json({
      success,
      message: `${targetType} spoiler flag toggled successfully.`,
    });
  } catch (error) {
    // Handle unexpected errors with a 500 status code
    console.error("Error:", error);
    return res.status(500).json({
      success: false,
      error: "Internal Server Error",
      message: "An error occurred.",
    });
  }
});

postsOrCommentsRouter.patch(
  "/posts-or-comments/lock-unlock",
  async (req, res) => {
    try {
      let togglerFunction;
      let targetType;

      // Determine whether to toggle a post or a comment based on the request
      if (req.body.is_post) {
        togglerFunction = postToggler;
        targetType = "post";
      } else {
        togglerFunction = commentToggler;
        targetType = "comment";
      }

      // Toggle the spoiler_flag using the appropriate function
      const { success, err, status, msg } = await togglerFunction(
        req,
        "locked_flag"
      );

      // Check if the toggle operation was successful
      if (!success) {
        // If not successful, send an error response
        return res.status(status).json({ success, error: err, message: msg });
      }

      // If successful, send a success response
      return res.status(200).json({
        success,
        message: `${targetType} locked flag toggled successfully.`,
      });
    } catch (error) {
      // Handle unexpected errors with a 500 status code
      console.error("Error:", error);
      return res.status(500).json({
        success: false,
        error: "Internal Server Error",
        message: "An error occurred.",
      });
    }
  }
);

postsOrCommentsRouter.patch(
  "/posts-or-comments/edit-text",
  async (req, res) => {
    try {
      let editFunction;
      let targetType;

      // Determine whether to toggle a post or a comment based on the request
      if (req.body.is_post) {
        editFunction = editPostDescription;
        targetType = "post";
      } else {
        editFunction = editCommentDescription;
        targetType = "comment";
      }

      const { success, err, status, msg } = await editFunction(req);

      if (!success) {
        // If not successful, send an error response
        return res.status(status).json({ success, error: err, message: msg });
      }

      // If successful, send a success response
      return res.status(200).json({
        success,
        message: `${targetType} edited successfully.`,
      });
    } catch (error) {
      // Handle unexpected errors with a 500 status code
      console.error("Error:", error);
      return res.status(500).json({
        success: false,
        error: "Internal Server Error",
        message: "An error occurred.",
      });
    }
  }
);

postsOrCommentsRouter.post("/posts-or-comments/vote", async (req, res) => {
  try {
    let voteFunction;
    let targetType;

    // Determine whether to toggle a post or a comment based on the request
    if (req.body.is_post) {
      voteFunction = postVote;
      targetType = "post";
    } else {
      voteFunction = commentVote;
      targetType = "comment";
    }

    const { success, err, status, msg } = await voteFunction(req);

    if (!success) {
      // If not successful, send an error response
      return res.status(status).json({ success, error: err, message: msg });
    }

    // If successful, send a success response
    return res.status(200).json({
      success,
      message: `${targetType} voted successfully.`,
    });
  } catch (error) {
    // Handle unexpected errors with a 500 status code
    console.error("Error:", error);
    return res.status(500).json({
      success: false,
      error: "Internal Server Error",
      message: "An error occurred.",
    });
  }
});

postsOrCommentsRouter.patch("/posts-or-comments/save", async (req, res) => {
  try {
    let saveFunction;
    let targetType;

    // Determine whether to toggle a post or a comment based on the request
    if (req.body.is_post) {
      saveFunction = postSave;
      targetType = "post";
    } else {
      saveFunction = commentSave;
      targetType = "comment";
    }

    const { success, err, status, msg } = await saveFunction(req);

    if (!success) {
      // If not successful, send an error response
      return res.status(status).json({ success, error: err, message: msg });
    }

    // If successful, send a success response
    return res.status(200).json({
      success,
      message: `${targetType} saved/unsaved successfully.`,
    });
  } catch (error) {
    // Handle unexpected errors with a 500 status code
    console.error("Error:", error);
    return res.status(500).json({
      success: false,
      error: "Internal Server Error",
      message: "An error occurred.",
    });
  }
});

postsOrCommentsRouter.post("/posts/approve", async (req, res) => {
  try {
    const result = await postApprove(req);
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

postsOrCommentsRouter.post("/posts/remove", async (req, res) => {
  try {
    const result = await postRemove(req);
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

postsOrCommentsRouter.post("/posts/report", async (req, res) => {
  try {
    const result = await postReport(req);
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

postsOrCommentsRouter.post("/comments/approve", async (req, res) => {
  try {
    const result = await commentApprove(req);
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

postsOrCommentsRouter.post("/comments/remove", async (req, res) => {
  try {
    const result = await commentRemove(req);
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

postsOrCommentsRouter.post("/comments/report", async (req, res) => {
  try {
    const result = await commentReport(req);
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

postsOrCommentsRouter.post("/posts/delete", async (req, res) => {
  try {
    const result = await postDelete(req);
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

postsOrCommentsRouter.post("/comments/delete", async (req, res) => {
  try {
    const result = await commentDelete(req);
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
