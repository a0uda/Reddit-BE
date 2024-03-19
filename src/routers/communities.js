import express from "express";
import {
    getApprovedUsers, addNewCommunity, addNewRuleToCommunity, editCommunityRule, deleteCommunityRule, getCommunityRules, editCommunityGeneralSettings, getAllUsers, approveUser, editDetailsWidget, addCommunityProfilePicture,
    addCommunityBannerPicture, deleteCommunityBannerPicture, deleteCommunityProfilePicture, getDetailsWidget
} from "../services/communities.js";

const communityRouter = express.Router();

communityRouter.post("/communities/add_community", async (req, res, next) => {
    console.log("hi");
    try {
        const { err, success } = await addNewCommunity(req.body)
        console.log(err, success)

        if (err) { return next(err) }

        res.status(200).json({ message: 'OK' });

    } catch (error) {
        next(error)
    }
})

communityRouter.post("/communities/add_rule", async (req, res, next) => {
    try {
        const { err, success } = await addNewRuleToCommunity(req.body)

        if (err) { return next(err) }

        res.status(200).json({ message: 'OK' });

    } catch (error) {
        next(error)
    }
})

communityRouter.post("/communities/edit_rule", async (req, res, next) => {
    try {
        const { err, success } = await editCommunityRule(req.body)
        console.log("the response is :")
        console.log(err, success)

        if (err) { return next(err) }

        res.status(200).json({ message: 'OK' });

    } catch (error) {
        next(error)
    }
})

communityRouter.post("/communities/delete_rule", async (req, res, next) => {
    try {
        const { err, success } = await deleteCommunityRule(req.body)

        if (err) { return next(err) }

        res.status(200).json({ message: 'OK' });

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

communityRouter.get("/communities/about/approved_users/:community_name", async (req, res, next) => {
    try {
        const { err, users } = await getApprovedUsers(req.params.community_name)

        if (err) { return next(err) }

        return res.status(200).send(users)

    } catch (error) {
        next(error)
    }
})

communityRouter.post("/communities/edit_general_settings/:community_name", async (req, res, next) => {
    try {
        const { err, success } = await editCommunityGeneralSettings(req.params.community_name, req.body)

        if (err) { return next(err) }

        res.status(200).json({ message: 'OK' });

    } catch (error) {
        next(error)
    }
})
//i use this api just for testing because i cant open the database :) , it has nothing todo with community endpoints 
communityRouter.get("/all_users", async (req, res, next) => {
    try {
        const { err, users } = await getAllUsers()

        if (err) { return next(err) }

        return res.status(200).send(users)

    } catch (error) {
        next(error)
    }
})
//testing done
//documenation updated
communityRouter.post("/communities/approve_user", async (req, res, next) => {
    try {
        console.log(req.body)
        const { err, success } = await approveUser(req.body)

        if (err) { return next(err) }

        res.status(200).json({ message: 'OK' });

    } catch (error) {
        next(error)
    }
})

communityRouter.get("/communities/get_approved_users/:community_name", async (req, res, next) => {
    try {
        const { err, success } = await getApprovedUsers(req.params.community_name)

        if (err) { return next(err) }

        return res.status(200).send(users)

    } catch (error) {
        next(error)
    }
})

communityRouter.post("/communities/edit_details_widget", async (req, res, next) => {
    try {
        const { err, success } = await editDetailsWidget(req.body)

        if (err) { return next(err) }

        res.status(200).json({ message: 'OK' });

    } catch (error) {
        next(error)
    }
})
communityRouter.get("/communities/get_details_widget/:community_name", async (req, res, next) => {
    try {
        const { err, widget } = await getDetailsWidget(req.params.community_name)

        if (err) { return next(err) }

        return res.status(200).send(widget)

    } catch (error) {
        next(error)
    }
})

communityRouter.post("/communities/add_profile_picture", async (req, res, next) => {
    try {
        const { err, success } = await addCommunityProfilePicture(req.body)

        if (err) { return next(err) }

        res.status(200).json({ message: 'OK' });

    } catch (error) {
        next(error)
    }
})

communityRouter.post("/communities/add_banner_picture", async (req, res, next) => {
    try {
        const { err, success } = await addCommunityBannerPicture(req.body)

        if (err) { return next(err) }

        res.status(200).json({ message: 'OK' });

    } catch (error) {
        next(error)
    }
})
//testing done
//documenation updated
communityRouter.post("/communities/delete_profile_picture", async (req, res, next) => {
    try {
        const { err, sucess } = await deleteCommunityProfilePicture(req.body)

        if (err) { return next(err) }

        res.status(200).json({ message: 'OK' });

    } catch (error) {
        next(error)
    }
})

communityRouter.post("/communities/delete_banner_picture", async (req, res, next) => {
    try {
        const { err, success } = await deleteCommunityBannerPicture(req.body)

        if (err) { return next(err) }

        res.status(200).json({ message: 'OK' });

    } catch (error) {
        next(error)
    }
})

export { communityRouter }
