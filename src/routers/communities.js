import express from "express";

import {
    addNewCommunity,
    getCommunityGenerlSettings,
    getCommunityContentControls,
    getCommunityPostsCommentsSettings,
    changeCommunityGeneralSettings,
    changeCommunityContentControls,
    changeCommunityPostsCommentsSettings,
    addPostToCommunity,
    getPostsByCommunityCategory,
    getCommunityMembersCount,

    addNewRuleToCommunity,
    editCommunityRule,
    deleteCommunityRule,
    getCommunityRules,

    approveUser,
    getApprovedUsers,
    getAllUsers,

    getDetailsWidget,
    editDetailsWidget,

    addCommunityProfilePicture,
    deleteCommunityProfilePicture,

    addCommunityBannerPicture,
    deleteCommunityBannerPicture,
    getComments,
    addComment,
    getMutedUsers,
    muteUser,
} from "../services/communities.js";

const communityRouter = express.Router();

communityRouter.post("/communities/add-community", async (req, res, next) => {
    try {
        const { err, community } = await addNewCommunity(req.body)

        if (err) { return next(err) }

        return res.status(201).send(community)

    } catch (error) {
        next(error)
    }
})

//////////////////////////////////////////////////////////////////////// Get Settings //////////////////////////////////////////////////////////////
communityRouter.get("/communities/get-general-settings/:community_name", async (req, res, next) => {
    try {
        const community_name = req.params.community_name

        const { err, general_settings } = await getCommunityGenerlSettings(community_name)

        if (err) { return next(err) }

        return res.status(200).send(general_settings)

    } catch (error) {
        next(error)
    }
})

communityRouter.get("/communities/get-content-controls/:community_name", async (req, res, next) => {
    try {
        const community_name = req.params.community_name

        const { err, content_controls } = await getCommunityContentControls(community_name)

        if (err) { return next(err) }

        return res.status(200).send(content_controls)

    } catch (error) {
        next(error)
    }
})

communityRouter.get("/communities/get-posts-and-comments/:community_name", async (req, res, next) => {
    try {
        const community_name = req.params.community_name

        const { err, posts_and_comments } = await getCommunityPostsCommentsSettings(community_name)

        if (err) { return next(err) }

        return res.status(200).send(posts_and_comments)

    } catch (error) {
        next(error)
    }
})

//////////////////////////////////////////////////////////////////////// Change Settings //////////////////////////////////////////////////////////////
communityRouter.post("/communities/change-general-settings/:community_name", async (req, res, next) => {
    try {
        const community_name = req.params.community_name
        const general_settings = req.body

        const { err, updated_general_settings } = await changeCommunityGeneralSettings(community_name, general_settings)

        if (err) { return next(err) }

        return res.status(200).send(updated_general_settings)

    } catch (error) {
        next(error)
    }
})

communityRouter.post("/communities/change-content-controls/:community_name", async (req, res, next) => {
    try {
        const community_name = req.params.community_name
        const content_controls = req.body

        const { err, updated_content_controls } = await changeCommunityContentControls(community_name, content_controls)

        if (err) { return next(err) }

        return res.status(200).send(updated_content_controls)

    } catch (error) {
        next(error)
    }
})

communityRouter.post("/communities/change-posts-and-comments/:community_name", async (req, res, next) => {
    try {
        const community_name = req.params.community_name
        const posts_and_comments = req.body

        const { err, updated_posts_and_comments } = await changeCommunityPostsCommentsSettings(community_name, posts_and_comments)

        if (err) { return next(err) }

        return res.status(200).send(updated_posts_and_comments)

    } catch (error) {
        next(error)
    }
})

//////////////////////////////////////////////////////////////////////// Posts Retrieval //////////////////////////////////////////////////////////////
communityRouter.post("/communities/add-post/:community_name", async (req, res, next) => {
    try {
        const community_name = req.params.community_name

        const { err, post } = await addPostToCommunity(community_name, req.body)

        if (err) { return next(err) }

        return res.status(201).send(post)

    } catch (error) {
        next(error)
    }
})

communityRouter.get("/communities/get-posts-by-category/:category", async (req, res, next) => {
    try {
        const category = req.params.category

        const { err, posts } = await getPostsByCommunityCategory(category)

        if (err) { return next(err) }

        return res.status(200).send(posts)

    } catch (error) {
        next(error)
    }
})

//////////////////////////////////////////////////////////////////////// Statistics //////////////////////////////////////////////////////////////
communityRouter.get("/communities/get-members-count/:community_name", async (req, res, next) => {
    try {
        const community_name = req.params.community_name

        const { err, members_count } = await getCommunityMembersCount(community_name)

        if (err) { return next(err) }

        return res.status(200).send({ members_count })

    } catch (error) {
        next(error)
    }
})

//////////////////////////////////////////////////////////////////////// Community Rules //////////////////////////////////////////////////////////////
// TODO: Implement the "Reorder Rules" API.
communityRouter.post("/communities/add-rule", async (req, res, next) => {
    try {
        const { err, success } = await addNewRuleToCommunity(req.body)

        if (err) { return next(err) }

        res.status(200).json({ message: 'OK' });

    } catch (error) {
        next(error)
    }
})

communityRouter.post("/communities/edit-rule", async (req, res, next) => {
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

communityRouter.post("/communities/delete-rule", async (req, res, next) => {
    try {
        const { err, success } = await deleteCommunityRule(req.body)

        if (err) { return next(err) }

        res.status(200).json({ message: 'OK' });

    } catch (error) {
        next(error)
    }
})

communityRouter.get("/communities/get-rules/:community_name", async (req, res, next) => {
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

//////////////////////////////////////////////////////////////////////// Approve Users //////////////////////////////////////////////////////////////
communityRouter.get("/communities/about/approved-users/:community_name", async (req, res, next) => {
    try {
        const { err, users } = await getApprovedUsers(req.params.community_name)

        if (err) { return next(err) }

        return res.status(200).send(users)

    } catch (error) {
        next(error)
    }
})

//i use this api just for testing because i cant open the database :) , it has nothing todo with community endpoints 
communityRouter.get("/all-users", async (req, res, next) => {
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
communityRouter.post("/communities/approve-user", async (req, res, next) => {
    try {
        console.log(req.body)
        const { err, success } = await approveUser(req.body)

        if (err) { return next(err) }

        res.status(200).json({ message: 'OK' });

    } catch (error) {
        next(error)
    }
})

//////////////////////////////////////////////////////////////////////// Details Widget //////////////////////////////////////////////////////////////
communityRouter.post("/communities/edit-details-widget", async (req, res, next) => {
    try {
        const { err, success } = await editDetailsWidget(req.body)

        if (err) { return next(err) }

        res.status(200).json({ message: 'OK' });

    } catch (error) {
        next(error)
    }
})
communityRouter.get("/communities/get-details-widget/:community_name", async (req, res, next) => {
    try {
        const { err, widget } = await getDetailsWidget(req.params.community_name)

        if (err) { return next(err) }

        return res.status(200).send(widget)

    } catch (error) {
        next(error)
    }
})

//////////////////////////////////////////////////////////////////////// Profile Picture //////////////////////////////////////////////////////////////
communityRouter.post("/communities/add-profile-picture", async (req, res, next) => {
    try {
        const { err, success } = await addCommunityProfilePicture(req.body)

        if (err) { return next(err) }

        res.status(200).json({ message: 'OK' });

    } catch (error) {
        next(error)
    }
})
//testing done
//documenation updated
communityRouter.post("/communities/delete-profile-picture", async (req, res, next) => {
    try {
        const { err, sucess } = await deleteCommunityProfilePicture(req.body)

        if (err) { return next(err) }

        res.status(200).json({ message: 'OK' });

    } catch (error) {
        next(error)
    }
})

//////////////////////////////////////////////////////////////////////// Profile Picture //////////////////////////////////////////////////////////////
communityRouter.post("/communities/delete-banner-picture", async (req, res, next) => {
    try {
        const { err, success } = await deleteCommunityBannerPicture(req.body)

        if (err) { return next(err) }

        res.status(200).json({ message: 'OK' });

    } catch (error) {
        next(error)
    }
})

communityRouter.post("/communities/add-banner-picture", async (req, res, next) => {
    try {
        const { err, success } = await addCommunityBannerPicture(req.body)

        if (err) { return next(err) }

        res.status(200).json({ message: 'OK' });

    } catch (error) {
        next(error)
    }
})


////////////////////////////////COMMENTS////////////////////////////////////////////////////////////
//this API should be completely changed , this was just a tool to test moderation it has nothing todo with comments
communityRouter.post("/communities/add-comment", async (req, res, next) => {
    try {
        const { err, success } = await addComment(req.body)

        if (err) { return next(err) }

        res.status(200).json({ message: 'OK' });

    } catch (error) {
        next(error)
    }
})
//GET COMMENT 
communityRouter.get("/communities/get-all-comments", async (req, res, next) => {
    try {
        const { err, comments } = await getComments()

        if (err) { return next(err) }

        return res.status(200).send(comments)

    } catch (error) {
        next(error)
    }
})
////////////////////////////////////////////////////MUTE USERS///////////////////////////////////////////////
communityRouter.post("/communities/mute-user", async (req, res, next) => {
    try {
        const { err, success } = await muteUser(req.body)


        if (err) { return next(err) }

        res.status(200).json({ message: 'OK' });

    } catch (error) {

        next(error)
    }
})
//get all muted users
communityRouter.get("/communities/get-all-muted-users/:community_name", async (req, res, next) => {
    try {
        console.log(req.params.community_name)
        const { err, users } = await getMutedUsers(req.params.community_name)

        if (err) { return next(err) }

        return res.status(200).send(users)

    } catch (error) {
        next(error)
    }
})
export { communityRouter }