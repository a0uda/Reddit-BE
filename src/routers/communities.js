import express from "express";
import { getApprovedUsers, addNewCommunity, addNewRuleToCommunity, editCommunityRule, deleteCommunityRule, getCommunityRules, editCommunityGeneralSettings, getAllUsers, approveUser } from "../services/communities.js";

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
//TODO : not tested untill we have users 
communityRouter.get("/communities/get_approved_users/:community_name", async (req, res, next) => {
    try {
        const { err, users } = await getApprovedUsers(req.params.community_name)

        if (err) { return next(err) }

        return res.status(200).send(users)

    } catch (error) {
        next(error)
    }
})
/*
 general_settings: {
    community_name :string 
    description: {
      type: String,
    },
    send_welcome_message_flag: {
        type: Boolean,}
    message: 
    {
        type: String,
    },

    language: {
      type: String,
      default: "English",
    },
    region: {
      type: String,
    },
    visibility: {
      type: String,
      enum: ["public", "private", "restricted"],
    },
    nsfw_flag: {
      type: Boolean,
      default: false,
    },
    accepting_requests_to_join: {
      type: String,
      default: true,
    }
    , approved_users_have_the_ability_to:
    {
      type: String,
      enum: ["comment only", "post only", "comment and post"],
      default: "post only",
    }
  }

*/
//testing done 
communityRouter.post("/communities/edit_general_settings", async (req, res, next) => {
    try {
        const { err, settings } = await editCommunityGeneralSettings(req.body)

        if (err) { return next(err) }

        return res.status(200).send(settings)

    } catch (error) {
        next(error)
    }
})
communityRouter.get("/all_users", async (req, res, next) => {
    try {
        const { err, users } = await getAllUsers()

        if (err) { return next(err) }

        return res.status(200).send(users)

    } catch (error) {
        next(error)
    }
})
//approve user psot request
communityRouter.post("/communities/approve_user", async (req, res, next) => {
    try {
        console.log(req.body)
        const { err, user } = await approveUser(req.body)

        if (err) { return next(err) }

        return res.status(200).send(user)

    } catch (error) {
        next(error)
    }
})
export { communityRouter }
