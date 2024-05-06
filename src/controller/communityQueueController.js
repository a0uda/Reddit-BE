import { verifyAuthToken } from "./userAuth.js";

import { Community } from "../db/models/Community.js";

import {
    objectItem,
    editItem,

    handleObjection,
    handleEdit,

    handleUnmoderatedItem,
    getItemsFromQueue
} from '../services/communityQueueService.js';

// const objectItem = async (item_id, item_type, objection_type, objected_by, objection_type_value, objection_reason)
export const objectItemConroller = async (req, res, next) => {
    try {
        const authenticated_user = req.user;
        const community_name = req.params.community_name;

        let { item_id, item_type, objection_type, objection_type_value } = req.body;

        if (!item_id || !item_type || !objection_type) {
            return next({ err: { status: 400, message: "You must provide the item_id, item_type and objection_type in the request body." } });
        }

        if (!objection_type_value) { objection_type_value = null; }
        
        const { err, message } = await objectItem(item_id, item_type, objection_type, authenticated_user, objection_type_value, community_name);

        if (err) { return next(err); }

        res.status(200).send(message);

    } catch (error) {
        return next({ err: { status: 500, message: error.message } });
    }
}

// const editItem = async (item_id, item_type, new_content, editing_user) 
export const editItemController = async (req, res, next) => {
    try {
        const authenticated_user = req.user;

        let { item_id, item_type, new_content } = req.body;

        if (!item_id || !item_type || !new_content) {
            return next({ err: { status: 400, message: "You must provide the item_id, item_type, and new_content in the request body." } });
        }

        const { err, message } = await editItem(item_id, item_type, new_content, authenticated_user);

        if (err) { return next(err); }

        res.status(200).send(message);

    } catch (error) {
        return next({ err: { status: 500, message: error.message } });
    }
}

// const handleObjection = async (item_id, item_type, objection_type, action)
export const handleObjectionController = async (req, res, next) => {
    try {
        const authenticated_user = req.user;

        let { item_id, item_type, objection_type, action } = req.body;

        if (!item_id || !item_type || !objection_type || !action) {
            return next({ err: { status: 400, message: "You must provide the item_id, item_type, objection_type, and action in the request body." } });
        }

        const { err, message } = await handleObjection(item_id, item_type, objection_type, action, authenticated_user);

        if (err) { return next(err); }

        res.status(200).send(message);

    } catch (error) {
        return next({ err: { status: 500, message: error.message } });
    }
}

// const handleEdit = async (item_id, item_type, action)
export const handleEditController = async (req, res, next) => {
    try {
        const authenticated_user = req.user;

        let { item_id, item_type, action } = req.body;

        if (!item_id || !item_type || !action) {
            return next({ err: { status: 400, message: "You must provide the item_id, item_type, and action in the request body." } });
        }

        const { err, message } = await handleEdit(item_id, item_type, action, authenticated_user);

        if (err) { return next(err); }

        res.status(200).send(message);

    } catch (error) {
        return next({ err: { status: 500, message: error.message } });
    }
}

// const handleUnmoderatedItem = async (itemId, itemType, userId, action)
export const handleUnmoderatedItemController = async (req, res, next) => {
    try {
        const authenticated_user = req.user;

        let { item_id, item_type, action } = req.body;

        if (!item_id || !item_type || !action) {
            return next({ err: { status: 400, message: "You must provide the item_id, item_type, and action in the request body." } });
        }

        const { err, message } = await handleUnmoderatedItem(item_id, item_type, authenticated_user, action);

        if (err) { return next(err); }

        res.status(200).send(message);

    } catch (error) {
        return next({ err: { status: 500, message: error.message } });
    }
}

// const getItemsFromQueue = async (time_filter, posts_or_comments, queue_type)
export const getItemsFromQueueController = async (req, res, next) => {
    try {
        const authenticated_user = req.user;

        let { time_filter, posts_or_comments, queue_type } = req.query;

        if (!time_filter || !posts_or_comments || !queue_type) {
            return next({ err: { status: 400, message: "You must provide the time_filter, posts_or_comments, and queue_type in the request query." } });
        }

        const { err, items } = await getItemsFromQueue(time_filter, posts_or_comments, queue_type, authenticated_user);

        if (err) { return next(err); }

        res.status(200).send(items);

    } catch (error) {
        return next({ err: { status: 500, message: error.message } });
    }
}