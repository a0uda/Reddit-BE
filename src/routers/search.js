import express from "express";
import {
  searchCommentCommunities,
  searchComments,
  searchCommunities,
  searchPostCommunities,
  searchPosts,
  searchUsers,
} from "../controller/search.js";

export const searchRouter = express.Router();

searchRouter.get("/search/people", async (req, res) => {
  try {
    const { page = 1, pageSize = 10 } = req.query;
    const pageNumber = parseInt(page);
    const pageSizeNumber = parseInt(pageSize);
    const { success, error, message, users } = await searchUsers(
      req,
      pageNumber,
      pageSizeNumber
    );
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

searchRouter.get("/search/posts", async (req, res) => {
  try {
    const {
      page = 1,
      pageSize = 10,
      sortBy = "relevance",
      sortTime = "allTime",
    } = req.query;
    const pageNumber = parseInt(page);
    const pageSizeNumber = parseInt(pageSize);
    const { success, error, message, posts } = await searchPosts(
      req,
      pageNumber,
      pageSizeNumber,
      sortBy,
      sortTime
    );
    if (!success) {
      res.status(error.status).send({ error });
      return;
    }
    res.status(200).send({ message, content: posts });
  } catch (e) {
    res
      .status(500)
      .send({ error: { status: 500, message: "Internal server error." } });
  }
});

searchRouter.get("/search/comments", async (req, res) => {
  try {
    const { page = 1, pageSize = 10, sortBy = "relevance" } = req.query;
    const pageNumber = parseInt(page);
    const pageSizeNumber = parseInt(pageSize);
    const { success, error, message, comments } = await searchComments(
      req,
      pageNumber,
      pageSizeNumber,
      sortBy
    );
    if (!success) {
      res.status(error.status).send({ error });
      return;
    }
    res.status(200).send({ message, content: comments });
  } catch (e) {
    res
      .status(500)
      .send({ error: { status: 500, message: "Internal server error." } });
  }
});

searchRouter.get("/search/communities", async (req, res) => {
  try {
    const { page = 1, pageSize = 10 } = req.query;
    const pageNumber = parseInt(page);
    const pageSizeNumber = parseInt(pageSize);
    const { success, error, message, communities } = await searchCommunities(
      req,
      pageNumber,
      pageSizeNumber
    );
    if (!success) {
      res.status(error.status).send({ error });
      return;
    }
    res.status(200).send({ message, content: communities });
  } catch (e) {
    res
      .status(500)
      .send({ error: { status: 500, message: "Internal server error." } });
  }
});

searchRouter.get(
  "/search/community/posts/:community_name",
  async (req, res) => {
    try {
      const {
        page = 1,
        pageSize = 10,
        sortBy = "relevance",
        sortTime = "allTime",
      } = req.query;
      const pageNumber = parseInt(page);
      const pageSizeNumber = parseInt(pageSize);
      const { success, error, message, posts } = await searchPostCommunities(
        req,
        pageNumber,
        pageSizeNumber,
        sortBy,
        sortTime
      );
      if (!success) {
        res.status(error.status).send({ error });
        return;
      }
      res.status(200).send({ message, content: posts });
    } catch (e) {
      res
        .status(500)
        .send({ error: { status: 500, message: "Internal server error." } });
    }
  }
);

searchRouter.get(
  "/search/community/comments/:community_name",
  async (req, res) => {
    try {
      const { page = 1, pageSize = 10, sortBy = "relevance" } = req.query;
      const pageNumber = parseInt(page);
      const pageSizeNumber = parseInt(pageSize);
      const { success, error, message, comments } =
        await searchCommentCommunities(req, pageNumber, pageSizeNumber, sortBy);
      if (!success) {
        res.status(error.status).send({ error });
        return;
      }
      res.status(200).send({ message, content: comments });
    } catch (e) {
      res
        .status(500)
        .send({ error: { status: 500, message: "Internal server error." } });
    }
  }
);
