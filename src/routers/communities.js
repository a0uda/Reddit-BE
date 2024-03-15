import express from "express";
import { addNewCommunity, addNewRuleToCommunity, editCommunityRule, deleteCommunityRule, getCommunityRules } from "../services/communities.js";

const communityRouter = express.Router();
//testing done 
communityRouter.post("/communities/add_community", async (req, res, next) => {
    try {
        const { err, community } = await addNewCommunity(req.body)

        if (err) { return next(err) }

        return res.status(201).send(community)

    } catch (error) {
        next(error)
    }
})
//testing done 
communityRouter.post("/communities/add_rule", async (req, res, next) => {
    try {
        const { err, community } = await addNewRuleToCommunity(req.body)

        if (err) { return next(err) }

        return res.status(201).send(community)

    } catch (error) {
        next(error)
    }
})
//TODO : not tested yet 
communityRouter.post("/communities/edit_rule", async (req, res, next) => {
    try {
        const { err, community } = await editCommunityRule(req.body)

        if (err) { return next(err) }

        return res.status(201).send(community)

    } catch (error) {
        next(error)
    }
})
//testing done 
communityRouter.post("/communities/delete_rule", async (req, res, next) => {
    try {
        const { err, rule } = await deleteCommunityRule(req.body)

        if (err) { return next(err) }

        return res.status(200).send(rule)

    } catch (error) {
        next(error)
    }
})
//testing done 
communityRouter.get("/communities/get_rules/:community_name", async (req, res, next) => {
    try {
        console.log(req.params.community_name);
        const { err, rules } = await getCommunityRules(req.params.community_name)
        console.log(rules)

        if (err) { return next(err) }

        return res.status(200).send(rules)

    } catch (error) {
        next(error)
    }
})

/*excpected fields from FE{
    community_name: string,
    community_description: string,
    Send welcome message to new members flag 
    language string
    reigon string
    community_type: string
    18+ flag 
    restricted community settings {}
    private Accepting requests to join flag 
} */
//TODO:not implemented yet
communityRouter.patch("/communities/edit_general_settings", async (req, res, next) => {
})
export { communityRouter }