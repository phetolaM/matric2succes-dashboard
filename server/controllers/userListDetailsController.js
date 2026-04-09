import UserList from "../models/userListModel.js";
import UserListCounter, {
    USER_LIST_BASELINE_COUNT,
    USER_LIST_COUNTER_KEY,
} from "../models/userListCounterModel.js";
import { sendCustomEmail } from "../services/mailgunClient.js";
import { sendNodemailerEmail } from "../services/nodemailerClient.js";
import { isIP } from "node:net";

function normalizeIpAddress(rawIp) {
    if (!rawIp) return null;

    let ip = rawIp;
    if (Array.isArray(ip)) ip = ip[0];
    if (typeof ip === "object") ip = JSON.stringify(ip);

    ip = String(ip)
        .replace(/\[|\]|"/g, "")
        .trim();

    if (!ip) return null;

    if (ip.includes(",")) {
        ip = ip.split(",")[0].trim();
    }

    if (ip.startsWith("::ffff:")) {
        ip = ip.replace("::ffff:", "");
    }

    if (/^\d+\.\d+\.\d+\.\d+:\d+$/.test(ip)) {
        ip = ip.split(":")[0];
    }

    return ip || null;
}

function isPublicIpAddress(ipAddress) {
    const ip = normalizeIpAddress(ipAddress);
    if (!ip) return false;

    const ipVersion = isIP(ip);
    if (!ipVersion) return false;

    if (ipVersion === 4) {
        if (ip === "127.0.0.1") return false;
        if (ip.startsWith("10.")) return false;
        if (ip.startsWith("192.168.")) return false;
        if (ip.startsWith("169.254.")) return false;
        if (ip.startsWith("0.")) return false;

        if (ip.startsWith("172.")) {
            const secondOctet = Number(ip.split(".")[1]);
            if (secondOctet >= 16 && secondOctet <= 31) return false;
        }

        return true;
    }

    const lowerIp = ip.toLowerCase();
    if (lowerIp === "::1") return false;
    if (lowerIp === "::") return false;
    if (lowerIp.startsWith("fe80:")) return false;
    if (lowerIp.startsWith("fc") || lowerIp.startsWith("fd")) return false;
    if (lowerIp.startsWith("2001:db8:")) return false;

    return true;
}

function hasRealLocation(realLocation) {
    if (!realLocation || typeof realLocation !== "object") return false;
    return Boolean(
        String(realLocation.country || "").trim() ||
        String(realLocation.province || "").trim() ||
        String(realLocation.city || "").trim(),
    );
}

function getRequestIp(req) {
    const forwarded = req.headers["x-forwarded-for"];
    const realIp = req.headers["x-real-ip"];
    return normalizeIpAddress(
        forwarded || realIp || req.ip || req.body?.ipAddress,
    );
}

async function convertIpToRealLocation(ipAddress) {
    const ip = normalizeIpAddress(ipAddress);
    if (!isPublicIpAddress(ip)) {
        return null;
    }

    try {
        const primary = await fetch(`https://ipapi.co/${ip}/json/`, {
            headers: { Accept: "application/json" },
            signal: AbortSignal.timeout(5000),
        });

        if (primary.ok) {
            const data = await primary.json();
            const location = {
                country: data?.country_name || null,
                province: data?.region || null,
                city: data?.city || data?.town || null,
            };
            if (hasRealLocation(location)) return location;
        }
    } catch (err) {
        // try fallback provider
    }

    try {
        const fallback = await fetch(`https://ipwho.is/${ip}`, {
            headers: { Accept: "application/json" },
            signal: AbortSignal.timeout(5000),
        });

        if (fallback.ok) {
            const data = await fallback.json();
            const location = {
                country: data?.country || data?.country_name || null,
                province: data?.region || data?.region_name || null,
                city: data?.city || data?.town || null,
            };
            if (hasRealLocation(location)) return location;
        }
    } catch (err) {
        // no-op, return empty location
    }

    return null;
}

export const saveApsUser = async (req, res) => {
    try {
        const { name, email } = req.body;
        if (!name || !email) {
            return res
                .status(400)
                .json({ message: "Name and email are required" });
        }
        const now = new Date();
        const requestIp = getRequestIp(req);

        // Normalize email to lowercase for consistent lookups
        const normalizedEmail = String(email).trim().toLowerCase();
        const normalizedName = String(name).trim();

        let user = await UserList.findOne({ email: normalizedEmail });

        if (user) {
            const visitIp = requestIp || user.ipAddress || null;
            const visitEntry = {
                date: now,
                ip: visitIp,
                ipAddress: visitIp,
            };

            // Existing user: log today's visit if not already
            const alreadyLogged = user.visits.some((visit) => {
                const value = visit?.date || visit;
                const visitDate = new Date(value);
                if (Number.isNaN(visitDate.getTime())) return false;
                return visitDate.toDateString() === now.toDateString();
            });
            if (!alreadyLogged) {
                user.visits.push(visitEntry);
            }

            if (!user.ipAddress && requestIp) {
                user.ipAddress = requestIp;
            }

            // If email hasn't been sent yet, send immediately (one-off)
            if (!user.emailSent) {
                try {
                    // send immediately using Mailgun (existing behavior)
                    await sendCustomEmail(
                        normalizedEmail,
                        normalizedName || "User",
                    );
                    user.emailSent = true;
                    user.emailSentAt = new Date();
                } catch (err) {
                    console.error(
                        "Failed to send immediate Mailgun email:",
                        err,
                    );
                    // don't fail the whole request if sending fails
                }
            }

            await user.save();
        } else {
            const currentCount = await UserList.countDocuments();

            await UserListCounter.updateOne(
                { key: USER_LIST_COUNTER_KEY },
                {
                    $setOnInsert: {
                        value: Math.max(USER_LIST_BASELINE_COUNT, currentCount),
                    },
                },
                { upsert: true },
            );

            const counter = await UserListCounter.findOneAndUpdate(
                { key: USER_LIST_COUNTER_KEY },
                { $inc: { value: 1 } },
                { new: true },
            );

            // New user: create and persist a one-off email schedule in 10 minutes.
            // A separate DB-backed scheduler will pick up due records and send them.
            const scheduledAt = new Date(now.getTime() + 10 * 60 * 1000);
            const firstIp = requestIp || null;
            const resolvedLocation = firstIp
                ? await convertIpToRealLocation(firstIp)
                : null;

            user = new UserList({
                userNumber: counter?.value,
                name: normalizedName,
                email: normalizedEmail,
                ipAddress: firstIp,
                visits: [{ date: now, ip: firstIp, ipAddress: firstIp }],
                scheduled: true,
                scheduledAt,
            });
            if (resolvedLocation) {
                user.realLocation = resolvedLocation;
            }
            await user.save();
        }

        res.status(201).json({ message: "User visit logged" });
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
};

export const getApsUsers = async (req, res) => {
    try {
        const users = await UserList.find().sort({ calculatedAt: -1 });
        res.json(users);
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
};

export const sendNowUser = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) return res.status(400).json({ message: "Missing id" });

        const user = await UserList.findById(id);
        if (!user) return res.status(404).json({ message: "User not found" });

        if (user.emailSent) {
            return res.status(200).json({ message: "Email already sent" });
        }

        // send via Nodemailer using stored user details; if SMTP not configured, fallback to Mailgun
        try {
            await sendNodemailerEmail(user.email, user.name || "User");
        } catch (err) {
            console.error(
                "sendNowUser encountered an error sending with Nodemailer:",
                err?.message || err,
            );
            // fallback to Mailgun if transporter missing or nodemailer failed
            try {
                await sendCustomEmail(user.email, user.name || "User");
                console.log("Fallback: sent email via Mailgun for", user.email);
            } catch (mgErr) {
                console.error("Fallback Mailgun send failed:", mgErr);
                return res.status(500).json({
                    message: "Failed to send email via Nodemailer and Mailgun",
                });
            }
        }

        user.emailSent = true;
        user.emailSentAt = new Date();
        user.scheduled = false;
        user.scheduledAt = null;
        await user.save();

        // return the updated user so the client can update state without re-fetching
        return res.json({ message: "Email sent", user });
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
};

export const deleteApsUser = async (req, res) => {
    try {
        const { id } = req.params;
        const deleted = await UserList.findByIdAndDelete(id);
        if (!deleted) {
            return res.status(404).json({ message: "User not found" });
        }
        res.json({ message: "User deleted" });
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
};
