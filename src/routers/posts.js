import express from "express";
import dotenv from "dotenv";
import {
  marknsfw,
  allowReplies,
  setSuggestedSort,
} from "../controller/posts.js";

dotenv.config();

export const postsRouter = express.Router();

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
