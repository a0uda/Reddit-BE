import express from "express";
import { User } from "../db/models/User.js"; //if error put .js
import { Post } from "../db/models/Post.js";
import dotenv from "dotenv";
import axios from "axios";
import jwt from "jsonwebtoken";

import { getPostsPaginated } from "../controller/postListing.js";
export const listingPostsRouter = express.Router();

listingPostsRouter.get("/listing/posts/best", async (req, res) => {
  try {
    const { page = 1, pageSize = 10 } = req.query;
    const pageNumber = parseInt(page);
    const pageSizeNumber = parseInt(pageSize);
    let sortBy = "best";

    const result = await getPostsPaginated(
      req,
      pageNumber,
      pageSizeNumber,
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

listingPostsRouter.get("/listing/posts/random", async (req, res) => {
  try {
    const { page = 1, pageSize = 10 } = req.query;
    const pageNumber = parseInt(page);
    const pageSizeNumber = parseInt(pageSize);
    let sortBy = "random";

    const result = await getPostsPaginated(
      req,
      pageNumber,
      pageSizeNumber,
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

listingPostsRouter.get("/listing/posts/hot", async (req, res) => {
  try {
    const { page = 1, pageSize = 10 } = req.query;
    const pageNumber = parseInt(page);
    const pageSizeNumber = parseInt(pageSize);
    let sortBy = "hot";

    const result = await getPostsPaginated(
      req,
      pageNumber,
      pageSizeNumber,
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

listingPostsRouter.get("/listing/posts/new", async (req, res) => {
  try {
    const { page = 1, pageSize = 10 } = req.query;
    const pageNumber = parseInt(page);
    const pageSizeNumber = parseInt(pageSize);
    let sortBy = "new";

    const result = await getPostsPaginated(
      req,
      pageNumber,
      pageSizeNumber,
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

listingPostsRouter.get("/listing/posts/top", async (req, res) => {
  try {
    const { page = 1, pageSize = 10 } = req.query;
    const pageNumber = parseInt(page);
    const pageSizeNumber = parseInt(pageSize);
    let sortBy = "top";

    const result = await getPostsPaginated(
      req,
      pageNumber,
      pageSizeNumber,
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
