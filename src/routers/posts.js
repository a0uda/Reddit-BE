import express from "express";
import dotenv from "dotenv";
import {
  marknsfw,
  allowReplies,
  setSuggestedSort,
  getViewsCount,
  getPost,
  getPostComments,
  getUserPostDetails,
  createPost,
  sharePost,
  pollVote,
  getTrendingPosts,
} from "../controller/posts.js";

dotenv.config();

export const postsRouter = express.Router();

postsRouter.post("/posts/new-post", async (req, res) => {
  try {
    const { success, error, message } = await createPost(req);
    if (!success) {
      res.status(error.status).send({ error });
      return;
    }
    res.status(200).send({ message });
  } catch (e) {
    res.status(500).send({ error: e });
  }
});

postsRouter.post("/posts/share-post", async (req, res) => {
  try {
    const { success, error, message } = await sharePost(req);
    if (!success) {
      res.status(error.status).send({ error });
      return;
    }
    res.status(200).send({ message });
  } catch (e) {
    res.status(500).send({ error: e });
  }
});

postsRouter.get("/posts/get-post", async (req, res) => {
  try {
    const { success, error, message, post } = await getPost(req, false);
    if (!success) {
      res.status(error.status).send({ error });
      return;
    }
    res.status(200).send({ message, content: post });
  } catch (e) {
    res.status(500).send({ error: e });
  }
});

postsRouter.get("/posts/get-user-details", async (req, res) => {
  try {
    const { success, error, message, user_details } = await getUserPostDetails(
      req
    );
    if (!success) {
      res.status(error.status).send({ error });
      return;
    }
    res.status(200).send({ message, content: user_details });
  } catch (e) {
    res.status(500).send({ error: e });
  }
});

postsRouter.get("/posts/get-comments", async (req, res) => {
  try {
    const { success, error, message, comments } = await getPostComments(req);
    if (!success) {
      res.status(error.status).send({ error });
      return;
    }
    res.status(200).send({ message, content: comments });
  } catch (e) {
    res.status(500).send({ error: e });
  }
});

postsRouter.get("/posts/views-count", async (req, res) => {
  try {
    const { success, error, message, views_count } = await getViewsCount(req);
    if (!success) {
      res.status(error.status).send({ error });
      return;
    }
    res.status(200).send({ message, content: views_count });
  } catch (e) {
    res.status(500).send({ error: e });
  }
});

postsRouter.patch("/posts/marknsfw", async (req, res) => {
  try {
    const { success, error, message } = await marknsfw(req);
    if (!success) {
      res.status(error.status).send({ error });
      return;
    }
    res.status(200).send({ message });
  } catch (e) {
    res.status(500).send({ error: e });
  }
});

postsRouter.patch("/posts/allow-replies", async (req, res) => {
  try {
    const { success, error, message } = await allowReplies(req);
    if (!success) {
      res.status(error.status).send({ error });
      return;
    }
    res.status(200).send({ message });
  } catch (e) {
    res.status(500).send({ error: e });
  }
});

postsRouter.patch("/posts/set-suggested-sort", async (req, res) => {
  try {
    const { success, error, message } = await setSuggestedSort(req);
    if (!success) {
      res.status(error.status).send({ error });
      return;
    }
    res.status(200).send({ message });
  } catch (e) {
    res.status(500).send({ error: e });
  }
});

postsRouter.post("/posts/poll-vote", async (req, res) => {
  try {
    const { success, error, message } = await pollVote(req);
    if (!success) {
      res.status(error.status).send({ error });
      return;
    }
    res.status(200).send({ message });
  } catch (e) {
    res.status(500).send({ error: e });
  }
});

postsRouter.get("/posts/trending", async (req, res) => {
  try {
    const { success, error, message, posts } = await getTrendingPosts(req);
    if (!success) {
      res.status(error.status).send({ error });
      return;
    }
    res.status(200).send({ message, content: posts });
  } catch (e) {
    res.status(500).send({ error: e });
  }
});
