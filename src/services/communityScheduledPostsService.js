// TODO: Scheduled posts appear in the unmoderated queue.
import { Post } from "../db/models/Post.js";

import {
    checkApprovedUser,
    checkBannedUser,
    checkNewPostInput,
    getCommunity,
    checkPostSettings,
    checkContentSettings
} from "./posts.js";

import {
    getCommunityGeneralSettings
} from "./communitySettingsService.js";

const schedulePost = async (postInput, user) => {
    // Check that the input to create the new post is valid.
    const { result, message } = await checkNewPostInput(postInput);

    // If the input is invalid, return an error.
    if (!result) {
        return { err: { status: 400, message: message } };
    }

    // Get the necessary attributes from the request body.
    const { title, description, post_in_community_flag, type, images, videos, link_url, polls, 
            polls_voting_length, community_name, oc_flag, spoiler_flag, nsfw_flag } = postInput;

    // Create a new post with the given attributes.
    const post = new Post({
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

    // Checks and values to set if the post is in a community.
    if (post_in_community_flag) {

        // 1. Check that the community exists.
        // This is a helper function not the original getCommunity function.
        const { success, community, error } = await getCommunity(community_name);
        
        if (!success) {
            return {err: {status: 400, message: error}};
        }
        
        // 2. Check if the community is restricted or private because then only approved users can post.
        const { err, general_settings } = await getCommunityGeneralSettings(community_name);
        
        if (err) {
            return next(err);
        }
        
        if (general_settings.type != "Public") {
            const {success: success_1, error: error_1} = await checkApprovedUser(community, user._id);
            if (!success_1) {
                return {err: {status: error_1.status, message: error_1.message}};
            }
        }
        
        // 3. Check if the user is banned from the community because then they can't post.
        const {success: success_2, error: error_2} = await checkBannedUser(community, user._id);
        
        if (!success_2) {
            return {err: {status: error_2.status, message: error_2.message}};
        }
        
        // 4. Check that the post follows the community "Posts and Comments Settings".
        const {success: success_3, error: error_3} = await checkPostSettings(post, community_name);
        
        if (!success_3) {
            return {err: {status: error_3.status, message: error_3.message}};
        }
        
        // 5. Check that the post follows the community "Content Controls".
        const {success: success_4, error: error_4} = await checkContentSettings(post, community_name);
        
        if (!success_4) {
            return {err: {status: error_4.status, message: error_4.message}};
        }

        // 6. Set the nsfw flag of the post to the nsfw flag of the community.
        post.nsfw_flag = general_settings.nsfw_flag;

        // 7. Set the community id of the post to the community id of the community.
        post.community_id = community._id;
    }

    // Set the values of the remaining post attributes & update the necessary user attributes.
    post.user_id = user._id;
    post.username = user.username;
    post.created_at = Date.now();
    post.upvotes_count++;
    user.upvotes_posts_ids.push(post._id);

    // Save the post and user to the database.
    await post.save();
    await user.save();

    // Return a success message.
    return {successMessage: "Post saved successfully!"};
}

export { schedulePost };