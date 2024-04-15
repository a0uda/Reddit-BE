// Mod Tools --> Settings --> General Settings
// Mod Tools --> Settings --> Posts and Comments
// Mod Tools --> Moderation --> Content Controls

import { Community } from "../db/models/Community.js";
import { CommunityGeneralSettings } from "../db/models/communityGeneralSettings.js";
import { CommunityContentControls } from "../db/models/communityContentControls.js";
import { CommunityPostsAndComments } from "../db/models/communityPostsAndComments.js";

// The Cross Platform Team will need these attributes only:
// General Settings:
//  - title
//  - description
//  - type
// Posts And Comments:
//  - post_type_options
//  - allow_image_uploads_and_links_to_image_hosting_sites
//  - allow_polls
//  - allow_videos


//////////////////////////////////////////////////////////////////////// Get Settings //////////////////////////////////////////////////////////////
const getCommunityGeneralSettings = async (community_name) => {
    // This could be due to a bug in the front-end code that incorrectly formats the community_name.
    if (typeof community_name !== 'string') {
        return { err: { status: 400, message: 'Invalid arguments' } };
    }

    try {
        const community = await Community.findOne({ name: community_name })
            .populate("general_settings")
            .exec();

        // This could be due to a bug in the front-end code that allows the user to send a request for a non-existent community,
        // or if the community was deleted from the database after the front-end allowed the user to open the community 
        // but before the request to access the community settings was sent.
        if (!community) {
            return { err: { status: 404, message: 'Community not found' } };
        }

        // This could happen if the general_settings ID stored in the community document does not exist in the CommunityGeneralSettings collection.
        // This could be due to a bug in the back-end code that allows a community document to be saved with an invalid general_settings ID,
        // or if the general_settings document was deleted from the database after the community document was fetched but before the general_settings document was fetched.
        if (typeof community.general_settings !== 'object') {
            return { err: { status: 500, message: 'Invalid general_settings ID' } };
        }

        return { general_settings: community.general_settings };
    } catch (error) {
        return { err: { status: 500, message: error.message } };
    }
};

const getCommunityContentControls = async (community_name) => {
    if (typeof community_name !== 'string') {
        return { err: { status: 400, message: 'Invalid arguments' } };
    }

    try {
        const community = await Community.findOne({ name: community_name })
            .populate("content_controls")
            .exec();

        if (!community) {
            return { err: { status: 404, message: 'Community not found' } };
        }

        if (typeof community.content_controls !== 'object') {
            return { err: { status: 500, message: 'Invalid content_controls ID' } };
        }

        return { content_controls: community.content_controls };
    } catch (error) {
        return { err: { status: 500, message: error.message } };
    }
};

const getCommunityPostsAndComments = async (community_name) => {
    if (typeof community_name !== 'string') {
        return { err: { status: 400, message: 'Invalid arguments' } };
    }

    try {
        const community = await Community.findOne({ name: community_name })
            .populate("posts_and_comments")
            .exec();

        if (!community) {
            return { err: { status: 404, message: 'Community not found' } };
        }

        if (typeof community.posts_and_comments !== 'object') {
            return { err: { status: 500, message: 'Invalid posts_and_comments ID' } };
        }

        return { posts_and_comments: community.posts_and_comments };
    } catch (error) {
        return { err: { status: 500, message: error.message } };
    }
};

//////////////////////////////////////////////////////////////////////// Change Settings //////////////////////////////////////////////////////////////
// These functions can be optimised by populating the settings attribute (exactly like in the get functions above) then accessing the settings attribute directly of the returned community from the query.
// TODO: Update these functions after finishing the Community Appearance feature.

const changeCommunityGeneralSettings = async (
    community_name,
    general_settings
) => {
    // This could be due to a bug in the front-end code that incorrectly formats the community_name and/or general_settings.
    if (typeof community_name !== 'string' || typeof general_settings !== 'object') {
        return { err: { status: 400, message: 'Invalid arguments' } };
    }

    try {
        const community = await Community.findOne({ name: community_name });

        // This could be due to a bug in the front-end code that allows the user to send a request for a non-existent community,
        // or if the community was deleted from the database after the front-end fetched the list of communities but before it sent the request.
        if (!community) {
            return { err: { status: 404, message: 'Community not found' } };
        }

        const communityGeneralSettings = await CommunityGeneralSettings.findById(community.general_settings);

        // This could happen if the general_settings ID stored in the community document does not exist in the CommunityGeneralSettings collection.
        // This could be due to a bug in the back-end code that allows a community document to be saved with an invalid general_settings ID,
        // or if the general_settings document was deleted from the database after the community document was fetched but before the general_settings document was fetched.
        if (!communityGeneralSettings) {
            return { err: { status: 404, message: 'General settings not found' } };
        }

        Object.assign(communityGeneralSettings, general_settings);

        await communityGeneralSettings.save();

        return { updated_general_settings: communityGeneralSettings };
    } catch (error) {
        return { err: { status: 500, message: error.message } };
    }
};

const changeCommunityContentControls = async (
    community_name,
    content_controls
) => {
    if (typeof community_name !== 'string' || typeof content_controls !== 'object') {
        return { err: { status: 400, message: 'Invalid arguments' } };
    }

    try {
        const community = await Community.findOne({ name: community_name });

        if (!community) {
            return { err: { status: 404, message: 'Community not found' } };
        }

        const communityContentControls = await CommunityContentControls.findById(community.content_controls);

        if (!communityContentControls) {
            return { err: { status: 404, message: 'Content controls not found' } };
        }

        Object.assign(communityContentControls, content_controls);

        await communityContentControls.save();

        return { updated_content_controls: communityContentControls };
    } catch (error) {
        return { err: { status: 500, message: error.message } };
    }
};

const changeCommunityPostsAndComments = async (
    community_name,
    posts_and_comments
) => {
    if (typeof community_name !== 'string' || typeof posts_and_comments !== 'object') {
        return { err: { status: 400, message: 'Invalid arguments' } };
    }

    try {
        const community = await Community.findOne({ name: community_name });

        if (!community) {
            return { err: { status: 404, message: 'Community not found' } };
        }

        const communityPostsAndComments = await CommunityPostsAndComments.findById(community.posts_and_comments);

        if (!communityPostsAndComments) {
            return { err: { status: 404, message: 'Posts and comments not found' } };
        }

        if (posts_and_comments.posts) {
            Object.assign(communityPostsAndComments.posts, posts_and_comments.posts);
        }
        
        if (posts_and_comments.comments) {
            Object.assign(communityPostsAndComments.comments, posts_and_comments.comments);
        }

        await communityPostsAndComments.save();

        return { updated_posts_and_comments: communityPostsAndComments };
    } catch (error) {
        return { err: { status: 500, message: error.message } };
    }
};

export {
    getCommunityGeneralSettings,
    getCommunityContentControls,
    getCommunityPostsAndComments,

    changeCommunityGeneralSettings,
    changeCommunityContentControls,
    changeCommunityPostsAndComments
};