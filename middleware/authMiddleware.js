import jwt from "jsonwebtoken";
import User from "../models/User.js";

const protectRoute = async (req, res, next) => {
    try {
        // Get token from header correctly
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({ msg: "No token found" });
        }

        // Extract token
        const token = authHeader.split(" ")[1];

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Get user from token
        const user = await User.findById(decoded.userId).select("-password");
        if (!user) {
            return res.status(401).json({ msg: "Invalid token" });
        }

        req.user = user;
        next();
    } catch (error) {
        console.log("Error occurred while verifying token", error);
        res.status(401).json({ msg: "Unauthorized" });
    }
};

export default protectRoute;
