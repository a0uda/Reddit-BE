import express from "express";
import dotenv from "dotenv";
import {
  hideNotification,
  getNotifications,
  markAsRead,
} from "../controller/notifications.js";
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

notificationsRouter.patch("/notifications/mark-as-read", async (req, res) => {
  try {
    const { success, error, message } = await markAsRead(req, false);
    if (!success) {
      res.status(error.status).send({ error });
      return;
    }
    res.status(200).send({ message });
  } catch (e) {
    res.status(500).send({ error: e });
  }
});
notificationsRouter.patch(
  "/notifications/mark-all-as-read",
  async (req, res) => {
    try {
      const { success, error, message } = await markAsRead(req, true);
      if (!success) {
        res.status(error.status).send({ error });
        return;
      }
      res.status(200).send({ message });
    } catch (e) {
      res.status(500).send({ error: e });
    }
  }
);
notificationsRouter.patch("/notifications/hide", async (req, res) => {
  try {
    const { success, error, message } = await hideNotification(req);
    if (!success) {
      res.status(error.status).send({ error });
      return;
    }
    res.status(200).send({ message });
  } catch (e) {
    res.status(500).send({ error: e });
  }
});
