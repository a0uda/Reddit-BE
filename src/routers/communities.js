import express from "express";

import {
    addNewCommunity,

    addDiscussionItemToCommunity,
    getDiscussionItemsByCommunityCategory,
    getDiscussionItemsByRandomCategory,

    getCommunityMembersCount,

    getRemovedDiscussionItems,
    getEditedDiscussionItems,
    getUnmoderatedDiscussionItems,

    getDetailsWidget,
    editDetailsWidget,

    getComments,
    addComment
} from "../services/communities.js";

import {
    getCommunityGeneralSettings,
    getCommunityContentControls,
    getCommunityPostsAndComments,

    changeCommunityGeneralSettings,
    changeCommunityContentControls,
    changeCommunityPostsAndComments,
} from "../services/communitySettings.js";

import {
    banUser,
    getBannedUsers,

    muteUser,
    getMutedUsers,

    approveUser,
    getApprovedUsers,

    addModerator,
    getModerators,
    deleteModerator,

    getAllUsers,
} from "../services/communityUserManagement.js";

import {
    addNewRuleToCommunity,
    editCommunityRule,
    deleteCommunityRule,
    getCommunityRules,
    getRemovalReasons,
    addNewRemovalReasonToCommunity,
    deleteRemovalReason,
    editRemovalReason
} from "../services/communityRulesAndRemovalReasons.js";

import {
    addCommunityProfilePicture,
    deleteCommunityProfilePicture,

    addCommunityBannerPicture,
    deleteCommunityBannerPicture,
} from "../services/communityProfileAndBannerPictures.js";

import {
    getAppearanceOptions,
    getAppearanceOption,
    updateAppearanceOption
} from "../services/communityAppearance.js";

const communityRouter = express.Router();

communityRouter.post("/communities/add-community", async (req, res, next) => {
    try {
        const { err, community_name } = await addNewCommunity(req.body)

        if (err) { return next(err) }

        return res.status(201).send({ community_name })

    } catch (error) {
        next(error)
    }
})

//////////////////////////////////////////////////////////////////////// Get Settings //////////////////////////////////////////////////////////////
communityRouter.get("/communities/get-general-settings/:community_name", async (req, res, next) => {
    try {
        const community_name = req.params.community_name

        const { err, general_settings } = await getCommunityGeneralSettings(community_name)

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

        const { err, posts_and_comments } = await getCommunityPostsAndComments(community_name)

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

        const { err, updated_posts_and_comments } = await changeCommunityPostsAndComments(community_name, posts_and_comments)

        if (err) { return next(err) }

        return res.status(200).send(updated_posts_and_comments)

    } catch (error) {
        next(error)
    }
})

//////////////////////////////////////////////////////////////////////// Discussion Items //////////////////////////////////////////////////////////////
communityRouter.post("/communities/add-item/:community_name", async (req, res, next) => {
    try {
        const community_name = req.params.community_name

        const { err, item } = await addDiscussionItemToCommunity(community_name, req.body)

        if (err) { return next(err) }

        return res.status(201).send(item)

    } catch (error) {
        next(error)
    }
})

communityRouter.get("/communities/get-items-by-category/:category/:item_type", async (req, res, next) => {
    try {
        const category = req.params.category
        const discussion_item_type = req.params.item_type

        const { err, items } = await getDiscussionItemsByCommunityCategory(category, discussion_item_type)

        if (err) { return next(err) }

        return res.status(200).send(items)

    } catch (error) {
        next(error)
    }
})

communityRouter.get("/communities/get-items-by-random-category/:item_type", async (req, res, next) => {
    try {
        const discussion_item_type = req.params.item_type

        const { err, items } = await getDiscussionItemsByRandomCategory(discussion_item_type)

        if (err) { return next(err) }

        return res.status(200).send(items)

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

//////////////////////////////////////////////////////////////////////// Mod Queue ////////////////////////////////////////////////////////////////////
communityRouter.get("/communities/r/mod/about/spam", async (req, res, next) => {
    try {
        const { community_name, time_filter, posts_or_comments } = req.body

        const removedDiscussionItems = await getRemovedDiscussionItems(community_name, time_filter, posts_or_comments)

        if (removedDiscussionItems.err) { return next(removedDiscussionItems.err) }

        return res.status(200).send(removedDiscussionItems)
    }
    catch (error) {
        next(error)
    }
});

communityRouter.get("/communities/r/mod/about/edited", async (req, res, next) => {
    try {
        const { community_name, time_filter, posts_or_comments } = req.body

        const editedDiscussionItems = await getEditedDiscussionItems(community_name, time_filter, posts_or_comments)

        if (editedDiscussionItems.err) { return next(editedDiscussionItems.err) }

        return res.status(200).send(editedDiscussionItems)
    }
    catch (error) {
        next(error)
    }
});


communityRouter.get("/communities/r/mod/about/unmoderated", async (req, res, next) => {
    try {
        const { community_name, time_filter } = req.body

        const unmoderatedDiscussionItems = await getUnmoderatedDiscussionItems(community_name, time_filter)

        if (unmoderatedDiscussionItems.err) { return next(unmoderatedDiscussionItems.err) }

        return res.status(200).send(unmoderatedDiscussionItems)
    }
    catch (error) {
        next(error)
    }
});

//////////////////////////////////////////////////////////////////////// Appearance //////////////////////////////////////////////////////////////
communityRouter.get("/communities/get-appearance-options/:community_name", async (req, res, next) => {
    try {
        const community_name = req.params.community_name

        const { err, appearance_options } = await getAppearanceOptions(community_name)

        if (err) { return next(err) }

        return res.status(200).send(appearance_options)

    } catch (error) {
        next(error)
    }
});

communityRouter.get("/communities/get-appearance-option/:community_name/:option_name", async (req, res, next) => {
    try {
        const community_name = req.params.community_name
        const option_name = req.params.option_name

        const { err, appearance_option } = await getAppearanceOption(community_name, option_name)

        if (err) { return next(err) }

        return res.status(200).send(appearance_option)

    } catch (error) {
        next(error)
    }
});

communityRouter.post("/communities/update-appearance-option/:community_name/:option_name", async (req, res, next) => {
    try {
        const community_name = req.params.community_name
        const option_name = req.params.option_name
        const new_value = req.body

        const { err, updated_appearance_option } = await updateAppearanceOption(community_name, option_name, new_value)

        if (err) { return next(err) }

        return res.status(200).send(updated_appearance_option)

    } catch (error) {
        next(error)
    }
});

//////////////////////////////////////////////////////////////////////// Community removal reasons ////////////////////////////////////////////////////
communityRouter.get("/communities/get-removal-reasons/:community_name", async (req, res, next) => {
    try {
        const community_name = req.params.community_name

        const { err, removal_reasons } = await getRemovalReasons(community_name)

        if (err) { return next(err) }

        return res.status(200).send(removal_reasons)

    } catch (error) {
        next(error)
    }
})
communityRouter.post("/communities/add-removal-reason", async (req, res, next) => {
    try {
        const { err, success } = await addNewRemovalReasonToCommunity(req.body)

        if (err) { return next(err) }

        res.status(200).json({ message: 'OK' });

    } catch (error) {
        next(error)
    }

})
communityRouter.post("/communities/delete-removal-reason", async (req, res, next) => {
    try {
        const { err, success } = await deleteRemovalReason(req.body)

        if (err) { return next(err) }

        res.status(200).json({ message: 'OK' });

    } catch (error) {
        next(error)
    }
})
//removal_reason_id

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
        console.log("the response is :")
        console.log(err, success)


        if (err) {

            return next(err)
        }

        res.status(200).json({ message: 'OK' });

    } catch (error) {

        next(error)
    }
})
communityRouter.get("/communities/get-details-widget/:community_name", async (req, res, next) => {
    try {
        const { err, widget } = await getDetailsWidget(req.params.community_name)

        if (err) { return next(err) }

        res.status(200).send(widget);

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
        console.log(success);
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
        const { err, success } = await muteUser(req)


        if (err) { return next(err) }

        res.status(200).json({ message: 'OK' });

    } catch (error) {

        next(error)
    }
})
//get all muted users
communityRouter.get("/communities/about/muted/:community_name", async (req, res, next) => {
    try {
        console.log(req.params.community_name)
        const { err, users } = await getMutedUsers(req.params.community_name)

        if (err) { return next(err) }

        return res.status(200).send(users)

    } catch (error) {
        next(error)
    }
})
////////////////////////////////////////////////////BAN USERS///////////////////////////////////////////////
communityRouter.post("/communities/ban-user", async (req, res, next) => {
    try {
        const { err, success } = await banUser(req.body)
        if (err) { return next(err) }
        res.status(200).json({ message: 'OK' });
    } catch (error) {
        next(error)
    }
})
//get all banned users
communityRouter.get("/communities/about/banned/:community_name", async (req, res, next) => {
    try {
        const { err, users } = await getBannedUsers(req.params.community_name)
        if (err) { return next(err) }
        return res.status(200).send(users)
    } catch (error) {
        next(error)
    }
})
//add moderaator
communityRouter.post("/communities/add-moderator", async (req, res, next) => {
    try {
        const { err, success } = await addModerator(req.body)
        if (err) { return next(err) }
        res.status(200).json({ message: 'OK' });
    } catch (error) {
        next(error)
    }
})
//get all moderators
communityRouter.get("/communities/about/moderators/:community_name", async (req, res, next) => {

    try {
        const { err, moderators } = await getModerators(req.params.community_name)
        if (err) { return next(err) }
        return res.status(200).send(moderators)
    } catch (error) {
        next(error)
    }
})
//remove moderator
communityRouter.post("/communities/remove-moderator", async (req, res, next) => {
    try {

        const { err, success } = await deleteModerator(req.body)
        if (err) { return next(err) }
        res.status(200).json({ message: 'OK' });
    } catch (error) {
        next(error)
    }
})

export { communityRouter }