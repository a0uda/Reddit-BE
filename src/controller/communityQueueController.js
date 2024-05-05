import { verifyAuthToken } from "./userAuth.js";

import { Community } from "../db/models/Community.js";

import { 
    getRemovedItems, 
    getReportedItems, 
    getUnmoderatedItems,
    getEditedItems,
    
    removeItem,
    spamItem,
    reportItem,
    approveItem,
    editItem,
    approveEdit,
    removeEdit
} from '../services/communityQueueService.js';

// This is a dummy change to test merging the ChatsFeature branch.

export const getRemovedItemsController = async (req, res, next) => {
    try {
        console.log("Entered the controller")

        // This attributes should be received as request Params not in the request body.
        const { time_filter, posts_or_comments } = req.query;
        console.log(time_filter, posts_or_comments);
        
        const { success, err: auth_error, status, user: authenticated_user } = await verifyAuthToken(req);
        
        if (!success) {
            const err = { status: status, message: auth_error };
            return next(err);
        }

        const community_name = req.params.community_name;

        const community = await Community.findOne({ name: community_name, 'moderators.username': authenticated_user.username });
        
        if (!community) {
            const err = { status: 403, message: "Access denied. You must be a moderator to view this community's Removed Items Queue." };
            return next(err);
        }

        const { err, removedItems } = await getRemovedItems(community_name, time_filter, posts_or_comments);

        if (err) { return next(err) }

        return res.status(200).send(removedItems);
    }
    catch (error) {
        next(error);
    }
};

export const getReportedItemsController = async (req, res, next) => {
    try {
        const { time_filter, posts_or_comments } = req.query;

        const { success, err: auth_error, status, user: authenticated_user } = await verifyAuthToken(req);
        
        if (!success) {
            const err = { status: status, message: auth_error };
            return next(err);
        }

        const community_name = req.params.community_name;

        const community = await Community.findOne({ name: community_name, 'moderators.username': authenticated_user.username });
        
        if (!community) {
            const err = { status: 403, message: "Access denied. You must be a moderator to view this community's Reported Items Queue." };
            return next(err);
        }
        
        const { err, reportedItems } = await getReportedItems(community_name, time_filter, posts_or_comments);

        if (err) { return next(err) }

        return res.status(200).send(reportedItems);
    }
    catch (error) {
        next(error);
    }
};

export const getUnmoderatedItemsController = async (req, res, next) => {
    try {
        const { time_filter, posts_or_comments } = req.query;

        const { success, err: auth_error, status, user: authenticated_user } = await verifyAuthToken(req);
        
        if (!success) {
            const err = { status: status, message: auth_error };
            return next(err);
        }

        const community_name = req.params.community_name;

        const community = await Community.findOne({ name: community_name, 'moderators.username': authenticated_user.username });
        
        if (!community) {
            const err = { status: 403, message: "Access denied. You must be a moderator to view this community's Removed Items Queue." };
            return next(err);
        }

        const { err, unmoderatedItems } = await getUnmoderatedItems(community_name, time_filter, posts_or_comments);

        if (err) { return next(err) }

        return res.status(200).send(unmoderatedItems);
    }
    catch (error) {
        next(error);
    }
};

//////////////////////////////////////////////////////////////////////////// Buttons/Actions ////////////////////////////////////////////////////////////////////////////
export const removeItemController = async (req, res, next) => {
    try {
        const { item_id, item_type } = req.body;
        let { removed_removal_reason } = req.body;

        // If removed_removal_reason is not provided, set it to null
        if (!removed_removal_reason) {
            removed_removal_reason = null;
        }

        const { success, err: auth_error, status, user: authenticated_user } = await verifyAuthToken(req);
        
        if (!success) {
            const err = { status: status, message: auth_error };
            return next(err);
        }

        const community_name = req.params.community_name;

        const community = await Community.findOne({ name: community_name, 'moderators.username': authenticated_user.username });
        
        if (!community) {
            const err = { status: 403, message: "Access denied. You must be a moderator to remove items from this community." };
            return next(err);
        }

        const { err, message } = await removeItem(item_id, item_type, authenticated_user, removed_removal_reason);

        if (err) { return next(err) }

        return res.status(200).send(message);
    }
    catch (error) {
        next(error);
    }
}

export const spamItemController = async (req, res, next) => {
    try {    
        const { item_id, item_type } = req.body;
        let { spammed_removal_reason } = req.body;

        // If removed_removal_reason is not provided, set it to null
        if (!spammed_removal_reason) {
            spammed_removal_reason = null;
        }

        const { success, err: auth_error, status, user: authenticated_user } = await verifyAuthToken(req);
        
        if (!success) {
            const err = { status: status, message: auth_error };
            return next(err);
        }

        const community_name = req.params.community_name;

        const community = await Community.findOne({ name: community_name, 'moderators.username': authenticated_user.username });
        
        if (!community) {
            const err = { status: 403, message: "Access denied. You must be a moderator to mark items as spam from this community." };
            return next(err);
        }

        const { err, message } = await spamItem(item_id, item_type, authenticated_user, spammed_removal_reason);

        if (err) { return next(err) }

        return res.status(200).send(message);
    }
    catch (error) {
        next(error);
    }
}

export const reportItemController = async (req, res, next) => {
    try {
        const { item_id, item_type } = req.body;

        const { success, err: auth_error, status, user: authenticated_user } = await verifyAuthToken(req);
        
        if (!success) {
            const err = { status: status, message: auth_error };
            return next(err);
        }

        const community_name = req.params.community_name;

        const { err, message } = await reportItem(item_id, item_type, authenticated_user, community_name);

        if (err) { return next(err) }

        return res.status(200).send(message);
    }
    catch (error) {
        next(error);
    }
}

export const approveItemController = async (req, res, next) => {
    try {
        const { item_id, item_type } = req.body;

        const { success, err: auth_error, status, user: authenticated_user } = await verifyAuthToken(req);
        
        if (!success) {
            const err = { status: status, message: auth_error };
            return next(err);
        }

        const community_name = req.params.community_name;

        const community = await Community.findOne({ name: community_name, 'moderators.username': authenticated_user.username });
        
        if (!community) {
            const err = { status: 403, message: "Access denied. You must be a moderator to approve items in this community." };
            return next(err);
        }

        const { err, message } = await approveItem(item_id, item_type, authenticated_user);

        if (err) { return next(err) }

        return res.status(200).send(message);
    }
    catch (error) {
        next(error);
    }
}

/////////////////////////////////////////////////////////////////////////////////// New Phase 3 Endpoints ///////////////////////////////////////////////////////////////////////////////////

export const editItemController = async (req, res, next) => {
    try {
        const { item_id, item_type, new_content } = req.body;
        const editing_user = req.user;
        
        const { err, message } = await editItem(item_id, item_type, new_content, editing_user);

        if (err) { return next(err) }

        return res.status(200).send(message);
    }
    catch (error) {
        next(error);
    }
}

export const getEditedItemsController = async (req, res, next) => {
    try {
        const { time_filter, posts_or_comments } = req.query;

        const community_name = req.params.community_name;

        const { err, editedItems } = await getEditedItems(community_name, time_filter, posts_or_comments);

        if (err) { return next(err) }

        return res.status(200).send(editedItems);
    }
    catch (error) {
        next(error);
    }
}

export const approveEditController = async (req, res, next) => {
    try {
        const { item_id, item_type } = req.body;

        const { err, message } = await approveEdit(item_id, item_type);

        if (err) { return next(err) }

        return res.status(200).send(message);
    }
    catch (error) {
        next(error);
    }
}

export const removeEditController = async (req, res, next) => {
    try {
        const { item_id, item_type } = req.body;

        const { err, message } = await removeEdit(item_id, item_type);

        if (err) { return next(err) }

        return res.status(200).send(message);
    }
    catch (error) {
        next(error);
    }
}