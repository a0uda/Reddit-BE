import express from "express";

import {
    addDiscussionItemToCommunity,
    getDiscussionItemsByCommunityCategory,
    getDiscussionItemsByRandomCategory,

    getCommunityMembersCount,

    getDetailsWidget,
    editDetailsWidget,
    getMembersCount,


    // getComments,
    // addComment,
    getCommunity,

} from "../services/communityService.js";

import {
    banUser,
    getBannedUsers,
    editBannedUser,
    muteUser,
    getMutedUsers,

    approveUser,
    getApprovedUsers,

    addModerator,
    getModerators,
    deleteModerator,
    moderatorLeaveCommunity,
    getEditableModerators,
    getModeratorsSortedByDate,
    unapproveUser,


    acceptModeratorInvitation,
    getInvitedModerators,


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
    getCommunityProfilePicture,
    getCommunityBannerPicture,


    addCommunityBannerPicture,
    deleteCommunityBannerPicture,
} from "../services/communityProfileAndBannerPictures.js";

import {
    schedulePostController,
    getScheduledPostsController,
    editScheduledPostController,
    submitScheduledPostController,
    cancelScheduledPostController,

    addNewCommunityController,
    getCommunityNamesController,
    getCommunityNamesByPopularityController,
    getVisiblePostsController
} from "../controller/communityController.js";

import {
    getCommunityGeneralSettingsController,
    getCommunityContentControlsController,
    getCommunityPostsAndCommentsController,
    changeCommunityGeneralSettingsController,
    changeCommunityContentControlsController,
    changeCommunityPostsAndCommentsController
} from "../controller/communitySettingsController.js";

import {
    objectItemConroller,
    editItemController,

    handleObjectionController,
    handleEditController,
    handleUnmoderatedItemController,

    getItemsFromQueueController
} from '../controller/communityQueueController.js';

import {
    protectRoute,
    protectModeratorRoute
} from "../middleware/protectRoutes.js";


const communityRouter = express.Router();


// TODO: Validations.
// communityRouter.use(protectRoute)

//////////////////////////////////////////////////////////////////////// Miscellaneous //////////////////////////////////////////////////////////////
communityRouter.post("/communities/add-community", addNewCommunityController);
communityRouter.get("/communities/get-community-names", protectRoute, getCommunityNamesController);
communityRouter.get("/communities/get-community-names-by-popularity", getCommunityNamesByPopularityController);
communityRouter.get("/communities/get-visible-posts/:community_name", getVisiblePostsController);

//////////////////////////////////////////////////////////////////////// Get & Change Settings //////////////////////////////////////////////////////////////
// Unit Tests Coverage      ==> 100%
// Functional Documentation ==> Done
// API Documentation        ==> -

communityRouter.get("/communities/get-general-settings/:community_name", getCommunityGeneralSettingsController);
communityRouter.get("/communities/get-content-controls/:community_name", getCommunityContentControlsController);
communityRouter.get("/communities/get-posts-and-comments/:community_name", getCommunityPostsAndCommentsController);

communityRouter.post("/communities/change-general-settings/:community_name", changeCommunityGeneralSettingsController);
communityRouter.post("/communities/change-content-controls/:community_name", changeCommunityContentControlsController);
communityRouter.post("/communities/change-posts-and-comments/:community_name", changeCommunityPostsAndCommentsController);

//////////////////////////////////////////////////////////////////////// Mod Queue ////////////////////////////////////////////////////////////////////
// Unit Tests Coverage      ==> 95.86%
// Functional Documentation ==> Done
// API Documentation        ==> -

communityRouter.post("/communities/object-item/:community_name", protectRoute, protectModeratorRoute, objectItemConroller);
communityRouter.post("/communities/edit-item/:community_name", protectRoute, editItemController);

communityRouter.post("/communities/handle-objection/:community_name", protectRoute, protectModeratorRoute, handleObjectionController);
communityRouter.post("/communities/handle-edit/:community_name", protectRoute, protectModeratorRoute, handleEditController);
communityRouter.post("/communities/handle-unmoderated-item/:community_name", protectRoute, protectModeratorRoute, handleUnmoderatedItemController);

communityRouter.get("/communities/get-items-from-queue/:community_name", protectRoute, protectModeratorRoute, getItemsFromQueueController);

//////////////////////////////////////////////////////////////////////// Schedule Posts //////////////////////////////////////////////////////////////
// Unit Tests Coverage      ==> -
// Functional Documentation ==> Done
// API Documentation        ==> -

communityRouter.post("/communities/schedule-post/:community_name", protectRoute, protectModeratorRoute, schedulePostController);
communityRouter.get("/communities/get-scheduled-posts/:community_name", protectRoute, protectModeratorRoute, getScheduledPostsController);
communityRouter.post("/communities/edit-scheduled-post/:community_name", protectRoute, protectModeratorRoute, editScheduledPostController);
communityRouter.post("/communities/submit-scheduled-post/:community_name", protectRoute, protectModeratorRoute, submitScheduledPostController);
communityRouter.post("/communities/cancel-scheduled-post/:community_name", protectRoute, protectModeratorRoute, cancelScheduledPostController);

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
communityRouter.post("/communities/edit-removal-reason", async (req, res, next) => {
    try {
        const { err, success } = await editRemovalReason(req.body)

        if (err) { return next(err) }

        res.status(200).json({ message: 'OK' });

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
communityRouter.get("/communities/about/approved/:community_name", async (req, res, next) => {
    try {

        const { page = 1, pageSize = 100 } = req.query;
        const pageNumber = parseInt(page);
        const pageSizeNumber = parseInt(pageSize);

        const { err, users } = await getApprovedUsers(req.params.community_name, pageNumber, pageSizeNumber)

        if (err) { return next(err) }

        return res.status(200).send(users)

    } catch (error) {
        next(error)
    }
})
//unapprove user


//testing done
//documenation updated
communityRouter.post("/communities/approve-user", async (req, res, next) => {
    try {
        console.log(req.body)
        const { err, success } = await approveUser(req)

        if (err) { return next(err) }

        res.status(200).json({ message: 'OK' });

    } catch (error) {
        next(error)
    }
})
//un approve user
communityRouter.post("/communities/unapprove-user", async (req, res, next) => {
    try {
        const { err, success } = await unapproveUser(req)
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
//get profile picture 
communityRouter.get("/communities/get-profile-picture/:community_name", async (req, res, next) => {
    try {
        const { err, picture } = await getCommunityProfilePicture(req.params.community_name)

        if (err) { return next(err) }

        res.status(200).send(picture);

    } catch (error) {
        next(error)
    }
})
//get banner picture 
communityRouter.get("/communities/get-banner-picture/:community_name", async (req, res, next) => {
    try {
        const { err, picture } = await getCommunityBannerPicture(req.params.community_name)

        if (err) { return next(err) }

        res.status(200).send(picture);

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
// communityRouter.post("/communities/add-comment", async (req, res, next) => {
//     try {
//         const { err, success } = await addComment(req.body)

//         if (err) { return next(err) }

//         res.status(200).json({ message: 'OK' });

//     } catch (error) {
//         next(error)
//     }
// })
//GET COMMENT 
// communityRouter.get("/communities/get-all-comments", async (req, res, next) => {
//     try {
//         const { err, comments } = await getComments()

//         if (err) { return next(err) }

//         return res.status(200).send(comments)

//     } catch (error) {
//         next(error)
//     }
// })
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

        const { page = 1, pageSize = 100 } = req.query;
        const pageNumber = parseInt(page);
        const pageSizeNumber = parseInt(pageSize);


        const { err, users } = await getMutedUsers(req.params.community_name, pageNumber, pageSizeNumber)

        if (err) { return next(err) }

        return res.status(200).send(users)

    } catch (error) {
        next(error)
    }
})
////////////////////////////////////////////////////BAN USERS///////////////////////////////////////////////
communityRouter.post("/communities/ban-user", async (req, res, next) => {
    try {
        const { err, success } = await banUser(req)
        if (err) { return next(err) }
        res.status(200).json({ message: 'OK' });
    } catch (error) {
        next(error)
    }
})
//edit banned user details 
communityRouter.post("/communities/edit-banned-user", async (req, res, next) => {
    try {

        const { err, success } = await editBannedUser(req)



        if (err) { return next(err) }
        res.status(200).json({ message: 'OK' });
    } catch (error) {
        next(error)
    }
})
//get all banned users
communityRouter.get("/communities/about/banned/:community_name", async (req, res, next) => {
    try {
        const { page = 1, pageSize = 100 } = req.query;
        const pageNumber = parseInt(page);
        const pageSizeNumber = parseInt(pageSize);
        const { err, users } = await getBannedUsers(req.params.community_name, pageNumber, pageSizeNumber)
        if (err) { return next(err) }
        return res.status(200).send(users)
    } catch (error) {
        next(error)
    }
})
//add moderaator
communityRouter.post("/communities/add-moderator", async (req, res, next) => {
    try {
        const { err, success } = await addModerator(req)
        if (err) { return next(err) }
        res.status(200).json({ message: 'OK' });
    } catch (error) {
        next(error)
    }
})
//accept moderator request 
communityRouter.post("/communities/accept-moderator-invitation", async (req, res, next) => {
    try {
        const { err, success } = await acceptModeratorInvitation(req)
        if (err) { return next(err) }
        res.status(200).json({ message: 'OK' });
    } catch (error) {
        next(error)
    }
})
//get all moderators
communityRouter.get("/communities/about/moderators/:community_name", async (req, res, next) => {

    try {
        //pagination 
        const { page = 1, pageSize = 100 } = req.query;
        const pageNumber = parseInt(page);
        const pageSizeNumber = parseInt(pageSize);

        const { err, returned_moderators } = await getModerators(req.params.community_name, pageNumber, pageSizeNumber)
        if (err) { return next(err) }



        return res.status(200).send(returned_moderators)
    } catch (error) {

        next(error)
    }
})
communityRouter.get("/communities/about/invited-moderators/:community_name", async (req, res, next) => {

    try {
        const { err, returned_moderators } = await getInvitedModerators(req.params.community_name)
        if (err) { return next(err) }



        return res.status(200).send(returned_moderators)
    } catch (error) {

        next(error)
    }
})
//get editable moderators
communityRouter.get("/communities/about/editable-moderators/:community_name", async (req, res, next) => {
    try {
        //pagination 
        const { page = 1, pageSize = 100 } = req.query;
        const pageNumber = parseInt(page);
        const pageSizeNumber = parseInt(pageSize);

        const { err, editableModerators } = await getEditableModerators(req, pageNumber, pageSizeNumber)
        if (err) { return next(err) }
        return res.status(200).send(editableModerators)
    } catch (error) {
        next(error)
    }
})
//get moderators sorted by date
communityRouter.get("/communities/about/moderators-sorted/:community_name", async (req, res, next) => {
    try {
        //pagination 
        const { page = 1, pageSize = 100 } = req.query;
        const pageNumber = parseInt(page);
        const pageSizeNumber = parseInt(pageSize);

        const { err, returned_moderators } = await getModeratorsSortedByDate(req, pageNumber, pageSizeNumber)
        if (err) { return next(err) }
        return res.status(200).send(returned_moderators)
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
//moderator leave community
communityRouter.post("/communities/moderator-leave", async (req, res, next) => {
    try {
        const { err, success } = await moderatorLeaveCommunity(req)
        if (err) { return next(err) }
        res.status(200).json({ message: 'OK' });
    } catch (error) {
        next(error)
    }
})
//get members count
communityRouter.get("/communities/members-count/:community_name", async (req, res, next) => {
    try {
        const { err, members_count } = await getMembersCount(req.params.community_name)
        if (err) { return next(err) }
        return res.status(200).json({ members_count })
    } catch (error) {
        next(error)
    }

})
//get community view
communityRouter.get("/communities/get-community-view/:community_name", async (req, res, next) => {
    try {
        const { err, community } = await getCommunity(req)
        if (err) { return next(err) }
        return res.status(200).send(community)
    } catch (error) {
        next(error)
    }
}
)
export { communityRouter }