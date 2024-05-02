import jwt from "jsonwebtoken";
import { User } from "../db/models/User.js";

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

export default protectRoute;