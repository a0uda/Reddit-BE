import { verifyAuthToken } from "./userAuth.js";

import { Community } from "../db/models/Community.js";

import {
    getCommunityGeneralSettings,
    getCommunityContentControls,
    getCommunityPostsAndComments,
    changeCommunityGeneralSettings,
    changeCommunityContentControls,
    changeCommunityPostsAndComments
} from '../services/communitySettingsService.js';

async function getCommunityGeneralSettingsController(req, res, next) {
    try {
        const { success, err: auth_error, status, user: authenticated_user } = await verifyAuthToken(req);

        if (!success) {
            const err = { status: status, message: auth_error };
            return next(err);
        }

        const community_name = req.params.community_name;

        const community = await Community.findOne({ name: community_name, 'moderators.username': authenticated_user.username });
        
        if (!community) {
            const err = { status: 403, message: "Access denied. You must be a moderator to view this community's General Settings." };
            return next(err);
        }

        const { err, general_settings } = await getCommunityGeneralSettings(community_name);

        if (err) { return next(err); }

        return res.status(200).send(general_settings);
    } catch (error) {
        next(error);
    }
}

async function getCommunityContentControlsController(req, res, next) {
    try {
        const { success, err: auth_error, status, user: authenticated_user } = await verifyAuthToken(req);

        if (!success) {
            const err = { status: status, message: auth_error };
            return next(err);
        }

        const community_name = req.params.community_name;

        const community = await Community.findOne({ name: community_name, 'moderators.username': authenticated_user.username });
        
        if (!community) {
            const err = { status: 403, message: "Access denied. You must be a moderator to view this community's Content Controls." };
            return next(err);
        }

        const { err, content_controls } = await getCommunityContentControls(community_name);

        if (err) { return next(err); }

        return res.status(200).send(content_controls);
    } catch (error) {
        next(error);
    }
}

async function getCommunityPostsAndCommentsController(req, res, next) {
    try {
        const { success, err: auth_error, status, user: authenticated_user } = await verifyAuthToken(req);

        if (!success) {
            const err = { status: status, message: auth_error };
            return next(err);
        }

        const community_name = req.params.community_name;

        const community = await Community.findOne({ name: community_name, 'moderators.username': authenticated_user.username });
        
        if (!community) {
            const err = { status: 403, message: "Access denied. You must be a moderator to view this community's Posts And Comments Settings." };
            return next(err);
        }

        const { err, posts_and_comments } = await getCommunityPostsAndComments(community_name);

        if (err) { return next(err); }

        return res.status(200).send(posts_and_comments);
    } catch (error) {
        next(error);
    }
}

async function changeCommunityGeneralSettingsController(req, res, next) {
    try {
        const { success, err: auth_error, status, user: authenticated_user } = await verifyAuthToken(req);

        if (!success) {
            const err = { status: status, message: auth_error };
            return next(err);
        }

        const community_name = req.params.community_name;

        const community = await Community.findOne({ name: community_name, 'moderators.username': authenticated_user.username });
        
        if (!community) {
            const err = { status: 403, message: "Access denied. You must be a moderator to change this community's General Settings." };
            return next(err);
        }
        
        const general_settings = req.body;

        const { err, updated_general_settings } = await changeCommunityGeneralSettings(community_name, general_settings);

        if (err) { return next(err); }

        return res.status(200).send(updated_general_settings);
    } catch (error) {
        next(error);
    }
}

async function changeCommunityContentControlsController(req, res, next) {
    try {
        const { success, err: auth_error, status, user: authenticated_user } = await verifyAuthToken(req);

        if (!success) {
            const err = { status: status, message: auth_error };
            return next(err);
        }

        const community_name = req.params.community_name;

        const community = await Community.findOne({ name: community_name, 'moderators.username': authenticated_user.username });
        
        if (!community) {
            const err = { status: 403, message: "Access denied. You must be a moderator to view this community's Content Controls." };
            return next(err);
        }
           
        const content_controls = req.body;

        const { err, updated_content_controls } = await changeCommunityContentControls(community_name, content_controls);

        if (err) { return next(err); }

        return res.status(200).send(updated_content_controls);
    } catch (error) {
        next(error);
    }
}

async function changeCommunityPostsAndCommentsController(req, res, next) {
    try {
        const { success, err: auth_error, status, user: authenticated_user } = await verifyAuthToken(req);

        if (!success) {
            const err = { status: status, message: auth_error };
            return next(err);
        }

        const community_name = req.params.community_name;

        const community = await Community.findOne({ name: community_name, 'moderators.username': authenticated_user.username });
        
        if (!community) {
            const err = { status: 403, message: "Access denied. You must be a moderator to view this community's Posts And Comments Settings." };
            return next(err);
        }
        
        const posts_and_comments = req.body;

        const { err, updated_posts_and_comments } = await changeCommunityPostsAndComments(community_name, posts_and_comments);

        if (err) { return next(err); }

        return res.status(200).send(updated_posts_and_comments);
    } catch (error) {
        next(error);
    }
}

export {
    getCommunityGeneralSettingsController,
    getCommunityContentControlsController,
    getCommunityPostsAndCommentsController,
    changeCommunityGeneralSettingsController,
    changeCommunityContentControlsController,
    changeCommunityPostsAndCommentsController
};