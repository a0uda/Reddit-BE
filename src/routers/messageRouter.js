
import { markAllAsRead, composeNewMessage, getUserSentMessages, createUsernameMention, getUserUnreadMessagesCount, getUserUnreadMessages, getAllMessages, deleteMessage, getUserMentions, getUserPostReplies, markMessageAsRead, getMessagesInbox } from "../services/messageService.js";
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
messageRouter.post("/messages/mark-as-read", async (req, res, next) => {
    try {

        const { err, message } = await markMessageAsRead(req)

        if (err) { return next(err) }

        res.status(200).json({ message: 'OK' });

    } catch (error) {
        next(error)
    }
})
////////////mark ALL as read ////////// 
messageRouter.post("/messages/mark-all-as-read", async (req, res, next) => {
    try {
        const { err, message } = await markAllAsRead(req, true)

        if (err) { return next(err) }

        res.status(200).json({ message: 'OK' });

    } catch (error) {
        next(error)
    }
})
//get unread messages count 
messageRouter.get("/messages/unread-count", async (req, res, next) => {
    try {
        const { err, count } = await getUserUnreadMessagesCount(req)

        if (err) { return next(err) }

        res.status(200).json({ count });

    } catch (error) {
        next(error)
    }
})
//post username mention 
messageRouter.post("/messages/new-username-mention", async (req, res, next) => {
    try {
        const { err, message } = await createUsernameMention(req)

        if (err) { return next(err) }

        res.status(200).json({ message: 'OK' });

    } catch (error) {
        next(error)
    }
})
export { messageRouter };
////////////mark as read //////////
