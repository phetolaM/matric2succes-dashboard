import jwt from "jsonwebtoken";

/**
 * Middleware to verify JWT token for admin-only routes
 * Checks Authorization header for Bearer token
 * Validates token and checks if user exists in AdminCredential collection
 */
export const verifyAdmin = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res
            .status(401)
            .json({ success: false, message: "Unauthorized" });
    }
    const token = authHeader.split(" ")[1];
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.admin = decoded; // Attach decoded info (e.g., email) to req.admin
        next();
    } catch (err) {
        return res.status(403).json({ success: false, message: "Forbidden" });
    }
};
