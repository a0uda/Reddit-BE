
import { composeNewMessage, getUserSentMessages, getUserUnreadMessages, getAllMessages, deleteMessage, getUserMentions, getUserPostReplies, markMessageAsRead, getMessagesInbox } from "../services/messageService.js";
import express from "express";
const messageRouter = express.Router();
messageRouter.post("/messages/compose", async (req, res, next) => {
    try {

        const { err, message } = await composeNewMessage(req, false)

        if (err) { return next(err) }

        res.status(200).json({ message: 'OK' });

    } catch (error) {
        next(error)
    }
})
messageRouter.get("/messages/sent", async (req, res, next) => {
    try {
        const { err, messages } = await getUserSentMessages(req)

        if (err) { return next(err) }

        res.status(200).json({ messages });

    } catch (error) {
        next(error)
    }
})
messageRouter.get("/messages/unread", async (req, res, next) => {
    try {

        const { err, messages } = await getUserUnreadMessages(req)

        if (err) { return next(err) }

        res.status(200).json({ messages });

    } catch (error) {
        next(error)
    }
})
messageRouter.get("/messages/read-all-messages", async (req, res, next) => {
    try {
        console.log("debugging getUserUnreadMessages")
        const { err, messages } = await getAllMessages(req)

        if (err) { return next(err) }

        res.status(200).json({ messages });

    } catch (error) {
        next(error)
    }
})
messageRouter.post("/messages/del-msg", async (req, res, next) => {
    try {


        const { err, message } = await deleteMessage(req)

        if (err) { return next(err) }

        res.status(200).json({ message: 'OK' });

    } catch (error) {
        next(error)
    }
})

messageRouter.get("/messages/get-user-mentions", async (req, res, next) => {
    try {

        const { err, mentions } = await getUserMentions(req)

        if (err) { return next(err) }

        res.status(200).json({ mentions });

    } catch (error) {
        next(error)
    }
})
messageRouter.get("/messages/get-user-post-replies", async (req, res, next) => {
    try {

        const { err, replies } = await getUserPostReplies(req)

        if (err) { return next(err) }


        res.status(200).json({ replies });

    } catch (error) {
        next(error)
    }
})
messageRouter.get("/messages/inbox", async (req, res, next) => {
    try {

        const { err, messages } = await getMessagesInbox(req)

        if (err) { return next(err) }

        res.status(200).json({ messages });

    } catch (error) {
        next(error)
    }

}
)
messageRouter.post("/messages/reply", async (req, res, next) => {
    try {

        const { err, message } = await composeNewMessage(req, true)

        if (err) { return next(err) }

        res.status(200).json({ message: 'OK' });

    } catch (error) {
        next(error)
    }
})
export { messageRouter };
////////////mark as read //////////
messageRouter.post("/messages/mark-as-read", async (req, res, next) => {
    try {

        const { err, message } = await markMessageAsRead(req)

        if (err) { return next(err) }

        res.status(200).json({ message: 'OK' });

    } catch (error) {
        next(error)
    }
})