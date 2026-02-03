import jwt from "jsonwebtoken";

const DEFAULT_MAX_AGE = 60 * 60 * 2; // 2 hours in seconds

function getSecret() {
    const secret = process.env.SESSION_SECRET || process.env.JWT_SECRET;
    return secret || "development-secret-change-me";
}

export function createSession(payload, options = {}) {
    const maxAge = options.maxAge ?? DEFAULT_MAX_AGE;
    const token = jwt.sign(payload, getSecret(), { expiresIn: maxAge });
    return { token, maxAge };
}

export function verifySession(token) {
    try {
        const decoded = jwt.verify(token, getSecret());
        return { valid: true, payload: decoded };
    } catch (err) {
        return { valid: false, error: err?.message || "Invalid token" };
    }
}
