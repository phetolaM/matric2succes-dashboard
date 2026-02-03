import UserList from "../models/userListModel.js";
import { sendCustomEmail } from "../services/mailgunClient.js";
import { sendNodemailerEmail } from "../services/nodemailerClient.js";

export const saveApsUser = async (req, res) => {
    try {
        const { name, email } = req.body;
        if (!name || !email) {
            return res
                .status(400)
                .json({ message: "Name and email are required" });
        }
        const now = new Date();

        // Normalize email to lowercase for consistent lookups
        const normalizedEmail = String(email).trim().toLowerCase();
        const normalizedName = String(name).trim();

        let user = await UserList.findOne({ email: normalizedEmail });

        if (user) {
            // Existing user: log today's visit if not already
            const alreadyLogged = user.visits.some(
                (visit) => new Date(visit).toDateString() === now.toDateString()
            );
            if (!alreadyLogged) {
                user.visits.push(now);
            }

            // If email hasn't been sent yet, send immediately (one-off)
            if (!user.emailSent) {
                try {
                    // send immediately using Mailgun (existing behavior)
                    await sendCustomEmail(
                        normalizedEmail,
                        normalizedName || "User"
                    );
                    user.emailSent = true;
                    user.emailSentAt = new Date();
                } catch (err) {
                    console.error(
                        "Failed to send immediate Mailgun email:",
                        err
                    );
                    // don't fail the whole request if sending fails
                }
            }

            await user.save();
        } else {
            // New user: create and persist a one-off email schedule in 10 minutes.
            // A separate DB-backed scheduler will pick up due records and send them.
            const scheduledAt = new Date(now.getTime() + 10 * 60 * 1000);
            user = new UserList({
                name: normalizedName,
                email: normalizedEmail,
                visits: [now],
                scheduled: true,
                scheduledAt,
            });
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
                err?.message || err
            );
            // fallback to Mailgun if transporter missing or nodemailer failed
            try {
                await sendCustomEmail(user.email, user.name || "User");
                console.log("Fallback: sent email via Mailgun for", user.email);
            } catch (mgErr) {
                console.error("Fallback Mailgun send failed:", mgErr);
                return res
                    .status(500)
                    .json({
                        message:
                            "Failed to send email via Nodemailer and Mailgun",
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
