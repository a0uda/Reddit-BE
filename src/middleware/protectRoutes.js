import jwt from "jsonwebtoken";
import { User } from "../db/models/User.js";
import { Community } from "../db/models/Community.js";

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

export { protectRoute, protectModeratorRoute };