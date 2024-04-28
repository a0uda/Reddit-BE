import express from "express";
import dotenv from "dotenv";
import { getNotifications } from "../controller/notifications.js";
dotenv.config();

export const notificationsRouter = express.Router();

notificationsRouter.get("/notifications", async (req, res) => {
  try {
    const { success, error, message, notifications } = await getNotifications(
      req
    );
    if (!success) {
      res.status(error.status).send({ error });
      return;
    }
    res.status(200).send({ message, content: notifications });
  } catch (e) {
    res.status(500).send({ error: e });
  }
});
