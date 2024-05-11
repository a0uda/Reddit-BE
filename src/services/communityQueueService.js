/**
 * @module community/service/queue
 */

import { Post } from '../db/models/Post.js';
import { Comment } from '../db/models/Comment.js';
import { Community } from '../db/models/Community.js';

//////////////////////////////////////////////////////////////////////////// Actions ////////////////////////////////////////////////////////////////////////////

/**
 * Objects an item by setting the appropriate flags and details in the database.
 *
 * @param {string} item_id - The UUID of the item to be objected.
 * @param {string} item_type - The type of the item. Can be either 'post' or 'comment'.
 * @param {string} objection_type - The type of the objection. Can be either 'reported', 'spammed', or 'removed'.
 * @param {string} objected_by - The user who is objecting the item. This user must be a moderator of the community.
 * @param {string} objection_type_value - The reason for the objection. Must be a valid reason based on the objection type.
 * @param {string} community_name - The name of the community where the item is posted.
 *
 * @returns {Promise<Object>} - A promise that resolves to an object. If the function is successful, the object contains a message indicating the success. If an error occurs, the object contains an 'err' property with the status code and error message.
 *
 * @throws {Object} - If an error occurs, an object is thrown with an 'err' property containing the status code and error message.
 */

const objectItem = async (item_id, item_type, objection_type, objected_by, objection_type_value, community_name) => {
    try {
        // Validate that the item_type is either post of comment
        if (!['post', 'comment'].includes(item_type.toLowerCase())) {
            return { err: { status: 400, message: 'Invalid item type' } };
        }

        // Validate that the objection type is either 'reported', 'spammed', or 'removed'
        if (!['reported', 'spammed', 'removed'].includes(objection_type.toLowerCase())) {
            return { err: { status: 400, message: `Invalid objection type, the allowed types are 'reported', 'spammed', 'removed'.` } };
        }

        const report_reasons = [
            "Harassment",
            "Threatening violence",
            "Hate",
            "Minor abuse",
            "Sharing personal information",
            "Copyright violation",
            "Spam",
            "Report abuse"
        ]

        // Validate that the objection_type_value is an element in the removal_reasons array or report_reasons array based on the objection_type
        if (objection_type_value) {
            if (objection_type.toLowerCase() === 'reported') {
                if (!report_reasons.includes(objection_type_value)) {
                    return { err: { status: 400, message: 'Invalid objection type value, check the report reasons' } };
                }
            } else if (['removed', 'spammed'].includes(objection_type.toLowerCase())) {
                const community = await Community.findOne({ name: community_name });
                if (!community.removal_reasons.some(reason => reason.removal_reason_title === objection_type_value)) {
                    return { err: { status: 400, message: 'Invalid objection type value, check the community removal reasons' } };
                }
            }
        }

        // Determine the model based on the item_type
        const Model = item_type.toLowerCase() === 'post' ? Post : Comment;

        // Validate that the item exists in the database
        const item = await Model.findById(item_id);
        if (!item) {
            return { err: { status: 404, message: `${item_type.charAt(0).toUpperCase() + item_type.slice(1)} not found` } };
        }

        // Check if the last edit has been approved or removed
        const lastEdit = item.community_moderator_details.edit_history[item.community_moderator_details.edit_history.length - 1];
        if (lastEdit && lastEdit.edited_at !== null && !lastEdit.approved_edit_flag && !lastEdit.removed_edit_flag) {
            return { err: { status: 400, message: `${item_type.charAt(0).toUpperCase() + item_type.slice(1)} has been edited, no action taken on last edit, can't object` } };
        }

        // Check if any other objection flags are true
        for (let key in item.community_moderator_details) {
            if (item.community_moderator_details[key].flag) {
                return { err: { status: 400, message: `${item_type.charAt(0).toUpperCase() + item_type.slice(1)} already has an objection` } };
            }
        }

        // Object the item
        await Model.findByIdAndUpdate(item_id, {
            [`community_moderator_details.${objection_type}.flag`]: true,
            [`community_moderator_details.${objection_type}.by`]: objected_by,
            [`community_moderator_details.${objection_type}.date`]: new Date(),
            [`community_moderator_details.${objection_type}.type`]: objection_type_value,
            'community_moderator_details.unmoderated.any_action_taken': true,

            // Unnecessary code
            [`moderator_details.${objection_type}_flag`]: true,
            [`moderator_details.${objection_type}_by`]: objected_by,
            [`moderator_details.${objection_type}_date`]: new Date(),
            [`moderator_details.${objection_type}_removal_reason`]: objection_type_value
        });

        // Return a success message
        return { message: `${item_type.charAt(0).toUpperCase() + item_type.slice(1)} ${objection_type} successfully` };

    } catch (error) {
        // If an error occurs, return an error object with the status code and message
        return { err: { status: 500, message: error.message } };
    }
};

/**
 * Edits an item (post or comment) by updating its content in the database.
 *
 * @param {string} item_id - The UUID of the item to be edited.
 * @param {string} item_type - The type of the item. Can be either 'post' or 'comment'.
 * @param {string} new_content - The new content for the item. Must be a string.
 * @param {Object} editing_user - The user who is editing the item. This user must be the author of the item.
 *
 * @returns {Promise<Object>} - A promise that resolves to an object. If the function is successful, the object contains a message indicating the success. If an error occurs, the object contains an 'err' property with the status code and error message.
 *
 * @throws {Object} - If an error occurs, an object is thrown with an 'err' property containing the status code and error message.
 */

const editItem = async (item_id, item_type, new_content, editing_user) => {
    try {
        // Determine the model based on the item_type
        const Model = item_type.toLowerCase() === 'post' ? Post : Comment;

        // Validate that the item exists in the database.
        const item = await Model.findById(item_id);
        if (!item) {
            return { err: { status: 404, message: `${item_type.charAt(0).toUpperCase() + item_type.slice(1)} not found` } };
        }

        // Validate the the editing user is the same as the user who created the post or comment.
        if (item.username !== editing_user.username) {
            return { err: { status: 403, message: 'Access denied. You must be the author of the item to edit it.' } };
        }

        // Check if the item has been objected and no action has been taken on the objection
        for (let key in item.community_moderator_details) {
            if (item.community_moderator_details[key].flag) {
                return { err: { status: 400, message: `${item_type.charAt(0).toUpperCase() + item_type.slice(1)} has an objection, no action taken on objection, can't edit` } };
            }
        }

        // Validate that the new_content is provided and of type string.
        if (typeof new_content !== 'string') {
            return { err: { status: 400, message: 'Invalid new content' } };
        }

        // Update the item with the new content and add a new entry to the edit history
        await Model.findByIdAndUpdate(item_id, {
            description: new_content,
            $push: {
                'community_moderator_details.edit_history': {
                    edited_at: new Date(),
                }
            }
        });

        // Unnecessary code
        item.moderator_details.edited_at = new Date();

        // Return a success message.
        return { message: `${item_type.charAt(0).toUpperCase() + item_type.slice(1)} edited successfully` };
    } catch (error) {
        // If an error occurs, return an error object with the status code and message.
        return { err: { status: 500, message: error.message } };
    }
};

//////////////////////////////////////////////////////////////////////////// Handlers ////////////////////////////////////////////////////////////////////////////

/**
 * Handles an objection on an item (post or comment) by either approving or removing it.
 *
 * @param {string} item_id - The UUID of the item to handle the objection on.
 * @param {string} item_type - The type of the item. Can be either 'post' or 'comment'.
 * @param {string} objection_type - The type of the objection. Can be either 'reported', 'spammed', or 'removed'.
 * @param {string} action - The action to take on the objection. Can be either 'approve' or 'remove'.
 *
 * @returns {Promise<Object>} - A promise that resolves to an object. If the function is successful, the object contains a message indicating the success. If an error occurs, the object contains an 'err' property with the status code and error message.
 *
 * @throws {Object} - If an error occurs, an object is thrown with an 'err' property containing the status code and error message.
 */

const handleObjection = async (item_id, item_type, objection_type, action) => {
    try {
        // Determine the model based on the item_type
        const Model = item_type.toLowerCase() === 'post' ? Post : Comment;

        // Validate that the item exists in the database.
        const item = await Model.findById(item_id);
        if (!item) {
            return { err: { status: 404, message: `${item_type.charAt(0).toUpperCase() + item_type.slice(1)} not found` } };
        }

        // Check if the objection exists
        if (!item.community_moderator_details[objection_type].flag) {
            return { err: { status: 400, message: `No ${objection_type} objection exists on this ${item_type}` } };
        }

        // 1. Approve that the action is a valid value
        if (!['approve', 'remove'].includes(action)) {
            return { err: { status: 400, message: `Invalid action. Action must be either 'approve' or 'remove'` } };
        }

        // 2. Confirm that we can perform this action on this item
        const is_unhandled_item = item.community_moderator_details[objection_type].flag && !item.community_moderator_details[objection_type].confirmed;

        if (!is_unhandled_item) {
            return { err: { status: 400, message: `The ${objection_type} objection cannot be ${action}d because it has already been handled.` } };
        }

        // 3. Write a query object
        let updated_attributes = {};
        if (action === 'approve') {
            updated_attributes = {
                [`community_moderator_details.${objection_type}.confirmed`]: true,
            };
        } else if (action === 'remove') {
            updated_attributes = {
                [`community_moderator_details.${objection_type}.flag`]: false,
                [`community_moderator_details.${objection_type}.confirmed`]: false,

                // Unnecessary code
                [`moderator_details.${objection_type}_flag`]: false,
                [`moderator_details.${objection_type}_by`]: null,
                [`moderator_details.${objection_type}_date`]: null,
                [`moderator_details.${objection_type}_removal_reason`]: null
            };
        }

        try {
            // 4. Pass it to the and update method
            await Model.findByIdAndUpdate(item_id, updated_attributes);
        } catch (error) {
            return { err: { status: 500, message: error.message } };
        }

        // Return a success message.
        return { message: `${objection_type.charAt(0).toUpperCase() + objection_type.slice(1)} objection ${action}d successfully` };

    } catch (error) {
        // If an error occurs, return an error object with the status code and message.
        return { err: { status: 500, message: error.message } };
    }
};

/**
 * Handles an edit on an item (post or comment) by either approving or removing it.
 *
 * @param {string} item_id - The UUID of the item to handle the edit on.
 * @param {string} item_type - The type of the item. Can be either 'post' or 'comment'.
 * @param {string} action - The action to take on the edit. Can be either 'approve' or 'remove'.
 *
 * @returns {Promise<Object>} - A promise that resolves to an object. If the function is successful, the object contains a message indicating the success. If an error occurs, the object contains an 'err' property with the status code and error message.
 *
 * @throws {Object} - If an error occurs, an object is thrown with an 'err' property containing the status code and error message.
 */

const handleEdit = async (item_id, item_type, action) => {
    // Determine the model based on the item_type
    const Model = item_type === 'post' ? Post : Comment;

    let item;
    try {
        // Fetch the item
        item = await Model.findById(item_id);

        // Check if the item exists
        if (!item) {
            return { err: { status: 404, message: 'Item not found' } };
        }
    } catch (error) {
        return { err: { status: 500, message: error.message } };
    }

    // Get the last edit
    const lastEdit = item.community_moderator_details.edit_history[item.community_moderator_details.edit_history.length - 1];

    // Check if the last edit is not approved and not removed
    if (lastEdit && !lastEdit.approved_edit_flag && !lastEdit.removed_edit_flag) {
        // Handle the action
        if (action === 'approve') {
            lastEdit.approved_edit_flag = true;
        } else if (action === 'remove') {
            lastEdit.removed_edit_flag = true;
        } else {
            return { err: { status: 400, message: 'Invalid action' } };
        }

        item.community_moderator_details.unmoderated.any_action_taken = true;

        try {
            // Save the item
            await item.save();
        } catch (error) {
            return { err: { status: 500, message: `Error while saving the item after ${action}ing its edit: ${error.message}` } };
        }

    } else {
        return { err: { status: 400, message: 'The last edit is already approved or removed' } };
    }

    return { message: `Edit ${action}d successfully` };
};

/**
 * Handles an unmoderated item (post or comment) by either approving or removing it.
 *
 * @param {string} itemId - The UUID of the item to handle.
 * @param {string} itemType - The type of the item. Can be either 'post' or 'comment'.
 * @param {string} userId - The UUID of the user performing the action.
 * @param {string} action - The action to take on the item. Can be either 'approve' or 'remove'.
 *
 * @returns {Promise<Object>} - A promise that resolves to an object. If the function is successful, the object contains a message indicating the success. If an error occurs, the object contains an 'err' property with the status code and error message.
 *
 * @throws {Object} - If an error occurs, an object is thrown with an 'err' property containing the status code and error message.
 */

const handleUnmoderatedItem = async (itemId, itemType, userId, action) => {
    try {
        // Determine the model based on the item_type
        const Model = itemType.toLowerCase() === 'post' ? Post : Comment;

        const item = await Model.findById(itemId);
        if (!item) {
            return { err: { status: 404, message: `${itemType.charAt(0).toUpperCase() + itemType.slice(1)} not found` } };
        }

        // Check if any action has already been taken
        if (item.community_moderator_details.unmoderated.any_action_taken) {
            return { err: { status: 400, message: 'This item is already approved or removed' } };
        }

        if (action === 'approve') {
            item.community_moderator_details.unmoderated.approved.flag = true;
            item.community_moderator_details.unmoderated.approved.by = userId;
            item.community_moderator_details.unmoderated.approved.date = new Date();

            // Unnecessary code
            item.moderator_details.approved_flag = true;
            item.moderator_details.approved_by = userId;
            item.moderator_details.approved_date = new Date();

        } else if (action === 'remove') {
            const { err, message } = await objectItem(itemId, itemType, 'removed', userId, null, null);
            if (err) { return { err: { status: 500, message: err } } }
        } else {
            return { err: { status: 400, message: 'Invalid action' } };
        }

        item.community_moderator_details.unmoderated.any_action_taken = true;

        try {
            await item.save();
        } catch (error) {
            return { err: { status: 500, message: `Failed to save the item after ${action}ing it from the unmoderated queue.` } };
        }

        return { message: `${itemType.charAt(0).toUpperCase() + itemType.slice(1)} ${action}d successfully` };
    } catch (error) {
        return { err: { status: 500, message: error.message } };
    }
};

//////////////////////////////////////////////////////////////////////////// Pages ////////////////////////////////////////////////////////////////////////////

/**
 * Fetches items (posts or comments) from a specified queue of a community.
 *
 * @param {string} time_filter - The order in which to return the items. Can be either 'newest first' or 'oldest first'.
 * @param {string} posts_or_comments - The type of items to return. Can be either 'posts', 'comments', or 'posts and comments'.
 * @param {string} queue_type - The type of queue from which to fetch the items. Can be either 'reported', 'removed', 'unmoderated' or 'edited'.
 * @param {string} community_name - The name of the community from which to fetch the items.
 * @param {Object} authenticated_user - The user who is fetching the items. This user must be a moderator of the community.
 * @param {number} page - The page number to return in the pagination.
 * @param {number} limit - The number of items to return per page.
 *
 * @returns {Promise<Object>} - A promise that resolves to an object. If the function is successful, the object contains an 'items' property with the fetched items. If an error occurs, the object contains an 'err' property with the status code and error message.
 *
 * @throws {Object} - If an error occurs, an object is thrown with an 'err' property containing the status code and error message.
 */

const getItemsFromQueue = async (time_filter, posts_or_comments, queue_type, community_name, authenticated_user, page, limit) => {
    try {
        // Validate the time_filter parameter. It should be either 'newest first' or 'oldest first'.
        if (!['newest first', 'oldest first'].includes(time_filter.toLowerCase())) {
            return ({ err: { status: 400, message: 'Invalid time filter' } });
        }

        // Validate the posts_or_comments parameter. It should be either 'posts', 'comments', or 'posts and comments'.
        if (!['posts', 'comments', 'posts and comments'].includes(posts_or_comments.toLowerCase())) {
            return { err: { status: 400, message: 'Invalid posts or comments value' } };
        }

        // Define the query object
        let query = { community_name };

        // If queue_type is 'removed', we need to get items where either 'removed.flag' or 'spammed.flag' is true
        if (queue_type === 'removed') {
            query = {
                ...query,
                $or: [
                    { [`community_moderator_details.removed.flag`]: true, [`community_moderator_details.removed.confirmed`]: false },
                    { [`community_moderator_details.spammed.flag`]: true, [`community_moderator_details.spammed.confirmed`]: false }
                ]
            };
        }

        else if (queue_type === 'reported') {
            query = { ...query, [`community_moderator_details.reported.flag`]: true, [`community_moderator_details.reported.confirmed`]: false };
        }

        else if (queue_type === 'unmoderated') {
            query = { ...query, 'community_moderator_details.unmoderated.any_action_taken': false }
        }

        else if (queue_type === 'edited') {
            query = {
                ...query,
                $expr: {
                    $let: {
                        vars: {
                            lastEdit: { $arrayElemAt: ['$community_moderator_details.edit_history', -1] }
                        },
                        in: {
                            $and: [
                                { $eq: ['$$lastEdit.approved_edit_flag', false] },
                                { $eq: ['$$lastEdit.removed_edit_flag', false] }
                            ]
                        }
                    }
                }
            };
        }

        else {
            return { err: { status: 400, message: `Invalid queue type. Queue type must be either 'reported', 'removed', 'spammed', 'unmoderated' or 'edited' ` } };
        }

        // Fetch the items from the database based on the item_type
        const sortOrder = time_filter === 'Newest First' ? -1 : 1;

        let [posts, comments] = await Promise.all([
            (posts_or_comments.toLowerCase() === 'posts' || posts_or_comments.toLowerCase() === 'posts and comments') ? Post.find(query).sort({ created_at: sortOrder }).skip((page - 1) * limit).limit(limit) : [],
            (posts_or_comments.toLowerCase() === 'comments' || posts_or_comments.toLowerCase() === 'posts and comments') ? Comment.find(query).sort({ created_at: sortOrder }).skip((page - 1) * limit).limit(limit) : []
        ]);


        // Add the userVote attribute to each post and comment
        posts = posts.map(post => {
            let userVote = 'none';
            if (authenticated_user.upvotes_posts_ids.includes(post._id)) {
                userVote = 'up';
            } else if (authenticated_user.downvotes_posts_ids.includes(post._id)) {
                userVote = 'down';
            }
            return { ...post._doc, userVote };
        });

        // comments = comments.map(comment => {
        //     let userVote = 'none';
        //     if (authenticated_user.upvotes_comments_ids.includes(comment._id)) {
        //         userVote = 'up';
        //     } else if (authenticated_user.downvotes_comments_ids.includes(comment._id)) {
        //         userVote = 'down';
        //     }
        //     return { ...comment._doc, userVote };
        // });


        // Merge and sort the posts and comments. This will create a single array of posts and comments, sorted by creation date.
        let items = [...posts, ...comments];
        items.sort((a, b) => sortOrder * (new Date(a.created_at) - new Date(b.created_at)));

        // Return the items
        return { items };

    } catch (error) {
        // If an error occurs, return an error object with the status code and message.
        return { err: { status: 500, message: error.message } };
    }
};


export {
    objectItem,
    editItem,

    handleObjection,
    handleEdit,

    handleUnmoderatedItem,
    getItemsFromQueue
};