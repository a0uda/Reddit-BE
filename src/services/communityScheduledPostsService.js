/**
 * @module community/service/scheduled-posts
 */

// TODO: Scheduled posts appear in the unmoderated queue.
import { Post } from "../db/models/Post.js";
import { scheduledPost } from "../db/models/scheduledPosts.js";

import {
    checkNewPostInput,
    getCommunity,
    checkPostSettings,
    checkContentSettings
} from "./posts.js";

import { getCommunityGeneralSettings } from "./communitySettingsService.js";

import schedule from "node-schedule";

/**
 * Saves a post for future scheduling.
 *
 * @param {Object} scheduling_details - The details for when the post should be scheduled.
 * @param {Object} postInput - The input for the post. This object should contain the necessary attributes for a post.
 * @param {Object} user - The user who is creating the post.
 *
 * @returns {Promise<Object>} - A promise that resolves to an object. If the function is successful, the object contains a 'saved_post_id' property with the id of the saved post. If an error occurs, the object contains an 'err' property with the status code and error message.
 *
 * @throws {Object} - If an error occurs, an object is thrown with an 'err' property containing the status code and error message.
 */

const savePostForScheduling = async (scheduling_details, postInput, user) => {
    // Check that the input to create the new post is valid.
    const { result, message } = await checkNewPostInput(postInput);

    if (!result) {
        return { err: { status: 400, message: message } };
    }

    // Get the necessary attributes from the postInput object.
    const { title, description, post_in_community_flag, type, images, videos, link_url, polls,
        polls_voting_length, community_name, oc_flag, spoiler_flag, nsfw_flag } = postInput;

    // Create a new post with the given attributes.
    const post = new scheduledPost({
        scheduling_details,
        title,
        description,
        post_in_community_flag,
        type,
        images: type != "image_and_videos" && type !== "hybrid" ? [] : images,
        videos: type != "image_and_videos" && type !== "hybrid" ? [] : videos,
        link_url: type != "url" && type != "hybrid" ? null : link_url,
        polls: type != "polls" && type != "hybrid" ? [] : polls,
        polls_voting_length: type != "polls" && type != "hybrid" ? 3 : polls_voting_length,
        community_name,
        oc_flag,
        spoiler_flag,
        nsfw_flag,
    });


    // Check that the post follows the community "Posts and Comments Settings".
    const { success: success, error: error } = await checkPostSettings(post, community_name);

    if (!success) {
        return { err: { status: error.status, message: error.message } };
    }

    // Check that the post follows the community "Content Controls".
    const { success: success_2, error: error_2 } = await checkContentSettings(post, community_name);

    if (!success_2) {
        return { err: { status: error_2.status, message: error_2.message } };
    }

    // Set the nsfw flag of the post to the nsfw flag of the community.
    try {
        const { err, general_settings } = await getCommunityGeneralSettings(community_name)
        post.nsfw_flag = general_settings.nsfw_flag;
    } catch (error) {
        return { err: { status: 500, message: error.message } };
    }

    // Set the community id of the post to the community id of the community.
    try {
        const community = await getCommunity(community_name);
        post.community_id = community._id;
    } catch (error) {
        return { err: { status: 500, message: error.message } };
    }

    // Set the values of the remaining post attributes & update the necessary user attributes.
    post.user_id = user._id;
    post.username = user.username;
    post.created_at = Date.now();
    post.upvotes_count++;
    user.upvotes_posts_ids.push(post._id);

    // Save the post and user to the database.
    let savedPost
    try {
        savedPost = await post.save();
        await user.save();
    } catch (error) {
        return { err: { status: 500, message: error.message } };
    }

    // Return the saved post.
    // console.log(`Post with id ${savedPost._id} and title ${savedPost.title} saved successfully to be posted in the future!`)
    return { saved_post_id: savedPost._id };
}

/**
 * Posts a scheduled post immediately and removes it from the scheduled posts if it is not recurring.
 *
 * @param {string} post_id - The id of the scheduled post to post.
 *
 * @returns {Promise<Object>} - A promise that resolves to an object. If the function is successful, the object contains a 'successMessage' property with a success message. If an error occurs, the object contains an 'err' property with the status code and error message.
 *
 * @throws {Object} - If an error occurs, an object is thrown with an 'err' property containing the status code and error message.
 */

const postScheduledPost = async (post_id) => {
    // Find the scheduled post with the given post id.

    let scheduled_post;
    try {
        scheduled_post = await scheduledPost.findById(post_id);
    } catch (error) {
        // console.log(error)
        return { err: { status: 500, message: error.message } };
    }

    // Create a new post with the attributes of the scheduled post.
    const { scheduling_details, ...postAttributes } = scheduled_post._doc;
    let post = new Post({ ...postAttributes, _id: undefined, created_at: Date.now() });

    // Save the post to the database.
    try {
        post = await post.save();
    } catch (error) {
        // console.log(error)
        return { err: { status: 500, message: error.message } };
    }

    // Remove the scheduled post from the database if it is not recurring.
    if (scheduling_details.repetition_option.toLowerCase() === "none") {
        try {
            await scheduledPost.deleteOne({ _id: scheduled_post._id });
        }
        catch (error) {
            // console.log(error)
            return { err: { status: 500, message: error.message } };
        }

        // console.log(`Scheduled post with id ${scheduled_post._id} and title ${scheduledPost.title} removed successfully!`);
    }

    // Return a success message.
    // console.log(`Post with id ${post._id} and title ${post.title} posted successfully on ${post.created_at}!`)
    return { successMessage: `Post with title ${post.title} posted successfully on ${post.created_at}!` };
}

/**
 * Retrieves all scheduled posts for a given community and separates them into recurring and non-recurring posts.
 *
 * @param {string} community_name - The name of the community for which to retrieve the scheduled posts.
 *
 * @returns {Promise<Object>} - A promise that resolves to an object. The object contains two properties: 'recurring_posts' and 'non_recurring_posts'. Each property is an array of posts.
 */

const getScheduledPosts = async (community_name) => {

    // Find all the scheduled posts in the database excluding the 'moderator_details' field.
    const scheduled_posts = await scheduledPost.find({community_name: community_name}).select('-moderator_details').sort('-scheduling_details.schedule_date');

    // Filter the scheduled posts into recurring and non-recurring posts.
    const recurring_posts = scheduled_posts.filter(post => post.scheduling_details.repetition_option.toLowerCase() !== "none");
    const non_recurring_posts = scheduled_posts.filter(post => post.scheduling_details.repetition_option.toLowerCase() === "none");

    // Return the recurring and non-recurring posts.
    return { recurring_posts, non_recurring_posts };
}

/**
 * Edits the description of a scheduled post.
 *
 * @param {string} post_id - The id of the scheduled post to edit.
 * @param {string} new_description - The new description for the scheduled post.
 *
 * @returns {Promise<Object>} - A promise that resolves to an object. If the function is successful, the object contains an 'edited_post' property with the edited post. If an error occurs, the object contains an 'err' property with the status code and error message.
 *
 * @throws {Object} - If an error occurs, an object is thrown with an 'err' property containing the status code and error message.
 */

const editScheduledPost = async (post_id, new_description) => {
    try {
        // Get the post with the given id.
        let post;
        try {
            post = await scheduledPost.findById({ _id: post_id }).select('-moderator_details');
        } catch (error) {
            return { err: { status: 500, message: `Error while finding a scheduled post with the given id: ${error.message}` } };
        }

        // Update the description of the post.
        post.description = new_description;
        post.edited_at = Date.now();

        // console.log(post)

        try {
            await post.save();
        } catch (error) {
            return { err: { status: 500, message: `Error while saving the edited scheduled post: ${error.message}` } };
        }

        // Return the edited post.
        return { edited_post: post };
    } catch (error) {
        return { err: { status: 500, message: error.message } };
    }
}

/**
 * Submits a scheduled post immediately and removes it from the scheduled posts if it is not recurring.
 *
 * @param {string} post_id - The id of the scheduled post to submit.
 *
 * @returns {Promise<Object>} - A promise that resolves to an object. If the function is successful, the object contains a 'message' property with a success message. If an error occurs, the object contains an 'err' property with the status code and error message.
 *
 * @throws {Object} - If an error occurs, an object is thrown with an 'err' property containing the status code and error message.
 */

// submitScheduledPost can only be called with an id of a post from those in the scheduledPosts table and that are non recurring.
// it should delete the post from the scheduledPosts table and post it to the posts table.
// it should also cancel the scheduling of the post using job.cancel()

const submitScheduledPost = async (post_id) => {
    // Find the scheduled post with the given post id.
    const scheduled_post = await scheduledPost.findById(post_id);

    if (!scheduled_post) {
        return { err: { status: 404, message: `No scheduled post found with the id: ${post_id}` } };
    }

    // Create a new post with the attributes of the scheduled post.
    const { scheduling_details, ...postAttributes } = scheduled_post._doc;

    if (scheduling_details.repetition_option.toLowerCase() != "none") {
        return { err: { status: 400, message: "This post is recurring and cannot be submitted now." } };
    }

    let post = new Post({ ...postAttributes, _id: undefined, created_at: Date.now() });

    // Save the post to the database.
    try {
        post = await post.save();
    } catch (error) {
        return { err: { status: 500, message: `Failed to save the post to be submitted: ${error.message}` } };
    }

    // // Cancel the scheduling of the post.
    // try {
    //     await scheduled_post.scheduling_details.jobName.cancel();
    // } catch (error) {
    //     return { err: { status: 500, message: `Failed to cancel the scheduling of the post: ${error.message}` } };
    // }

    // Remove the scheduled post from the database if it is not recurring.
    try {
        await scheduledPost.deleteOne({ _id: scheduled_post._id });
    }
    catch (error) {
        return { err: { status: 500, message: `Failed to delete the scheduled post after submitting it: ${error.message} ` } };
    }

    // Return a success message.
    return { message: `Post with title ${post.title} posted successfully on ${post.created_at}!` };
}

/**
 * Cancels a scheduled post and removes it from the scheduled posts.
 *
 * @param {string} post_id - The id of the scheduled post to cancel.
 *
 * @returns {Promise<Object>} - A promise that resolves to an object. If the function is successful, the object contains a 'message' property with a success message. If an error occurs, the object contains an 'err' property with the status code and error message.
 *
 * @throws {Object} - If an error occurs, an object is thrown with an 'err' property containing the status code and error message.
 */

const cancelScheduledPost = async (post_id) => {
    // Find the scheduled post with the given post id.
    const scheduled_post = await scheduledPost.findById(post_id);

    if (!scheduled_post) {
        return { err: { status: 404, message: `No scheduled post found with the id: ${post_id}` } };
    }

    // // Cancel the scheduling of the post.
    // try {
    //     await scheduled_post.scheduling_details.jobName.cancel();
    // } catch (error) {
    //     return { err: { status: 500, message: `Failed to cancel the scheduling of the post: ${error.message}` } };
    // }

    // Remove the scheduled post from the database.
    try {
        await scheduledPost.deleteOne({ _id: scheduled_post._id });
    }
    catch (error) {
        return { err: { status: 500, message: `Failed to delete the scheduled post after cancelling it: ${error.message} ` } };
    }

    // Return a success message.
    return { message: `Post with title ${scheduled_post.title} cancelled successfully!` };
}

export { savePostForScheduling, postScheduledPost, getScheduledPosts, editScheduledPost, submitScheduledPost, cancelScheduledPost };