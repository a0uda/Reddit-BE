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
    console.log(`Post with id ${savedPost._id} and title ${savedPost.title} saved successfully to be posted in the future!`)
    return { saved_post_id: savedPost._id };
}

const postScheduledPost = async (post_id) => {
    // Find the scheduled post with the given post id.
    const scheduled_post = await scheduledPost.findById(post_id);

    // Create a new post with the attributes of the scheduled post.
    // let post = new Post({ ...scheduled_post._doc, _id: undefined, createdAt: Date.now() });
    const { scheduling_details, ...postAttributes } = scheduled_post._doc;
    let post = new Post({ ...postAttributes, _id: undefined, createdAt: Date.now() });

    // Save the post to the database.
    try {
        post = await post.save();
    } catch (error) {
        console.log(error)
        return { err: { status: 500, message: error.message } };
    }

    // Remove the scheduled post from the database if it is not recurring.
    if (scheduling_details.repetition_option.toLowerCase() === "none") {
        try {
            await scheduledPost.deleteOne({ _id: scheduled_post._id });
        }
        catch (error) {
            console.log(error)
            return { err: { status: 500, message: error.message } };
        }

        console.log(`Scheduled post with id ${scheduled_post._id} and title ${scheduledPost.title} removed successfully!`);
    }

    // Return a success message.
    console.log(`Post with id ${post._id} and title ${post.title} posted successfully on ${post.created_at}!`)
    return { successMessage: `Post with title ${post.title} posted successfully on ${post.created_at}!` };
}

const getScheduledPosts = async () => {
    // Find all the scheduled posts in the database excluding the 'moderator_details' field.
    const scheduled_posts = await scheduledPost.find({}).select('-moderator_details').sort('-scheduling_details.schedule_date');

    // Filter the scheduled posts into recurring and non-recurring posts.
    const recurring_posts = scheduled_posts.filter(post => post.scheduling_details.repetition_option.toLowerCase() !== "none");
    const non_recurring_posts = scheduled_posts.filter(post => post.scheduling_details.repetition_option.toLowerCase() === "none");

    // Return the recurring and non-recurring posts.
    return { recurring_posts, non_recurring_posts };
}

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

        console.log(post)
        
        try{
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

export { savePostForScheduling, postScheduledPost, getScheduledPosts, editScheduledPost };