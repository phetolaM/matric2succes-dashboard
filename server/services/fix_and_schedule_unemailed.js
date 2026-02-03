import dotenv from "dotenv";
import mongoose from "mongoose";
import UserList from "../models/userListModel.js";
import { sendNodemailerEmail } from "./nodemailerClient.js";
import { userListDbConnection } from "../config/userListDB/userListDB.js";

dotenv.config();

async function scheduleForUser(user) {
    try {
        const now = new Date();
        const scheduledAt = new Date(now.getTime() + 10 * 60 * 1000);
        user.scheduled = true;
        user.scheduledAt = scheduledAt;
        await user.save();

        const delay = Math.max(0, scheduledAt.getTime() - Date.now());
        console.log(
            `Scheduled email for ${
                user.email
            } at ${scheduledAt} (in ${Math.round(delay / 1000)}s)`
        );

        setTimeout(async () => {
            try {
                const fresh = await UserList.findOne({ email: user.email });
                if (!fresh)
                    return console.warn(
                        `User ${user.email} was removed before send.`
                    );
                if (fresh.emailSent)
                    return console.log(`User ${user.email} already sent.`);

                try {
                    await sendNodemailerEmail(fresh.email, fresh.name || "User");
                } catch (err) {
                    console.error("Scheduled send nodemailer failed:", err?.message || err);
                    // fallback to Mailgun if nodemailer not configured or failed
                    try {
                        const { sendCustomEmail } = await import("./mailgunClient.js");
                        await sendCustomEmail(fresh.email, fresh.name || "User");
                        console.log("Scheduled fallback: sent via Mailgun to", fresh.email);
                    } catch (mgErr) {
                        console.error("Scheduled fallback Mailgun failed:", mgErr);
                        continue;
                    }
                }

                fresh.emailSent = true;
                fresh.emailSentAt = new Date();
                fresh.scheduled = false;
                fresh.scheduledAt = null;
                await fresh.save();
                console.log(`Sent scheduled email to ${fresh.email}`);
            } catch (err) {
                console.error(`Failed scheduled send for ${user.email}:`, err);
            }
        }, delay);
    } catch (err) {
        console.error(`Failed to schedule user ${user.email}:`, err);
    }
}

async function main() {
    try {
        // Ensure DB connection is open
        if (!userListDbConnection || userListDbConnection.readyState !== 1) {
            // Try opening connection using env URI and DB name
            await userListDbConnection.openUri(process.env.MONGO_URI, {
                dbName: "UserList",
            });
            console.log("Connected to userList DB");
        }

        // Find users that haven't had email sent and aren't scheduled
        const unsent = await UserList.find({
            emailSent: { $ne: true },
            scheduled: { $ne: true },
        }).limit(500);
        console.log(`Found ${unsent.length} unsent users to schedule.`);

        for (const user of unsent) {
            await scheduleForUser(user);
            // small delay between scheduling to reduce spikes
            await new Promise((r) => setTimeout(r, 200));
        }

        console.log(
            "Scheduling pass complete. Exiting process (timers will still run while process alive)."
        );
        // keep the process alive if there are active timers, otherwise exit
        // give some time for setTimeouts to register, then exit if none
        setTimeout(() => process.exit(0), 2000);
    } catch (err) {
        console.error("Batch scheduling failed:", err);
        process.exit(1);
    }
}

main();
