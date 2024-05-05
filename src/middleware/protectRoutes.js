import jwt from "jsonwebtoken";
import { User } from "../db/models/User.js";
import { Community } from "../db/models/Community.js";
import { Post } from "../db/models/Post.js";
import { Comment } from "../db/models/Comment.js";

// This function is almost identical to verifyAuthToken()
// I will use this middleware to avoid re-writing the same code in every controller function.
const protectRoute = async (req, res, next) => {
	try {
		// const token = req.cookies.jwt;
		const token = req.headers.authorization?.split(" ")[1];

		if (!token) {
			const err = { status: 401, message: "Unauthorized - No Token Provided" };
			return next(err);
		}

		const decoded = jwt.verify(token, process.env.JWT_SECRET);

		if (!decoded) {
			const err = { status: 401, message: "Unauthorized - Invalid Token" };
			return next(err);
		}

		const user = await User.findById(decoded._id).select("-password");

		if (!user) {
			const err = { status: 404, message: "User not found" };
			return next(err);
		}

		req.user = user;

		next();
	} catch (error) {
		const err = { status: 500, message: error.message };
		return next(err);
	}
};

const protectModeratorRoute = async (req, res, next) => {
	try {
		const authenticated_user = req.user;

		const community_name = req.params.community_name;

		const community = await Community.findOne({ name: community_name });

		if (!community) {
			const err = { status: 404, message: "Community not found." };
			return next(err);
		}

		const isModerator = community.moderators.some(moderator => moderator.username === authenticated_user.username);

		if (!isModerator) {
			const err = { status: 403, message: "Access denied. You must be a moderator to access this page." };
			return next(err);
		}

		next();
	} catch (error) {
		const err = { status: 500, message: error.message };
		return next(err);
	}
}

const protectQueueActionsRoutes = async (req, res, next) => {
	const { item_id, item_type } = req.body;

	const community_name = req.params.community_name;

	try {
		const community = await Community.findOne({ name: community_name });

		if (!community) {
			const err = { status: 404, message: `A community with the name "${community_name}" does not exist` };
			return next(err);
		}

		// Validate the input parameters. They should be strings.
		if (typeof item_id !== 'string' || typeof item_type !== 'string') {
			const err = { status: 400, message: 'Invalid input parameters' };
			return next(err);
		}

		// Validate that the input is either 'post' or 'comment'.
		if (!['post', 'comment'].includes(item_type.toLowerCase())) {
			const err = { status: 400, message: 'Invalid item type' };
			return next(err);
		}

		// Validate that the post or comment exists in the database.
		if (item_type.toLowerCase() === 'post') {
			const post = await Post.findById(item_id);
			if (!post) {
				const err = { status: 404, message: 'Post not found' };
				return next(err);
			}
		}
		if (item_type.toLowerCase() === 'comment') {
			const comment = await Comment.findById(item_id);
			if (!comment) {
				const err = { status: 404, message: 'Comment not found' };
				return next(err);
			}
		}

		next();
	} catch (error) {
		const err = { status: 500, message: error.message };
		return next(err);
	}
}


const protectQueuePagesRoutes = async (req, res, next) => {
    try {
        const { time_filter, posts_or_comments } = req.query;

        const authenticated_user = req.user;

        const community_name = req.params.community_name;

        const community = await Community.findOne({ name: community_name, 'moderators.username': authenticated_user.username });

        if (!community) {
            const err = { status: 403, message: "Access denied. You must be a moderator to view this community's Queue." };
            return next(err);
        }
        
        // Validate the input parameters. They should all be strings.
        if (typeof community_name !== 'string' || typeof time_filter !== 'string' || typeof posts_or_comments !== 'string') {
            const err = { status: 400, message: 'Invalid input parameters' };
            return next(err);
        }

        // Validate the time_filter parameter. It should be either 'newest first' or 'oldest first'.
        if (!['newest first', 'oldest first'].includes(time_filter.toLowerCase())) {
            const err = { status: 400, message: 'Invalid time filter' };
            return next(err);
        }

        // Validate the posts_or_comments parameter. It should be either 'posts', 'comments', or 'posts and comments'.
        if (!['posts', 'comments', 'posts and comments'].includes(posts_or_comments.toLowerCase())) {
            const err = { status: 400, message: 'Invalid posts or comments value' };
            return next(err);
        }

        next();
    }
    catch (error) {
        next(error);
    }
}


export { protectRoute, protectModeratorRoute, protectQueueActionsRoutes, protectQueuePagesRoutes };