import express from "express";
import dotenv from "dotenv";
import {
  getCommentWithReplies,
  newComment,
  replyToComment,
} from "../controller/comments.js";

dotenv.config();

export const commentsRouter = express.Router();

commentsRouter.get("/comments/get-comment", async (req, res) => {
  try {
    const { success, error, message, comment } = await getCommentWithReplies(
      req
    );
    if (!success) {
      res.status(error.status).send({ error });
      return;
    }
    res.status(200).send({ message, content: comment });
  } catch (e) {
    res.status(500).send({ error: e });
  }
});

commentsRouter.post("/comments/new-comment", async (req, res) => {
  try {
    const { success, error, message } = await newComment(req);
    if (!success) {
      res.status(error.status).send({ error });
      return;
    }
    res.status(200).send({ message });
  } catch (e) {
    res.status(500).send({ error: e });
  }
});

commentsRouter.post("/comments/reply", async (req, res) => {
  try {
    const { success, error, message } = await replyToComment(req);
    if (!success) {
      res.status(error.status).send({ error });
      return;
    }
    res.status(200).send({ message });
  } catch (e) {
    res.status(500).send({ error: e });
  }
});
