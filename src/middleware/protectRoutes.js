import jwt from "jsonwebtoken";
import { User } from "../db/models/User.js";

// This function is almost identical to verifyAuthToken()
// I will use this middleware to avoid re-writing the same code in every controller function.
const protectRoute = async (req, res, next) => {
	try {
		// const token = req.cookies.jwt;
		const token = request.headers.authorization?.split(" ")[1];

		if (!token) {
			return res.status(401).json({ error: "Unauthorized - No Token Provided" });
		}

		const decoded = jwt.verify(token, process.env.JWT_SECRET);

		if (!decoded) {
			return res.status(401).json({ error: "Unauthorized - Invalid Token" });
		}

		const user = await User.findById(decoded.userId).select("-password");

		if (!user) {
			return res.status(404).json({ error: "User not found" });
		}

		req.user = user;

		next();
	} catch (error) {
		console.log("Error in protectRoute middleware: ", error.message);
		res.status(500).json({ error: "Internal server error" });
	}
};

export default protectRoute;