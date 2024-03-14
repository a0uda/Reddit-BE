import express from "express";
import { addNewCommunity, addNewRuleToCommunity } from "../services/communities.js";

const communityRouter = express.Router();

communityRouter.post("/communities/add_community", async (req, res, next) => {
    try {
        const { err, community } = await addNewCommunity(req.body)

        if (err) { return next(err) }

        return res.status(201).send(community)

    } catch (error) {
        next(error)
    }
})

communityRouter.post("/communities/add_rule", async (req, res, next) => {
    try {
        const { err, community } = await addNewRuleToCommunity(req.body)

        if (err) { return next(err) }

        return res.status(201).send(community)

    } catch (error) {
        next(error)
    }
})

export { communityRouter }