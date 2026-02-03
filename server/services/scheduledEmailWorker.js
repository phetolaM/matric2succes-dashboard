import dotenv from "dotenv";
import UserList from "../models/userListModel.js";
import { sendNodemailerEmail } from "./nodemailerClient.js";
import { sendCustomEmail } from "./mailgunClient.js";

dotenv.config();

const POLL_INTERVAL = Number(process.env.SCHEDULER_POLL_INTERVAL_MS) || 30000; // 30s
const BATCH_SIZE = Number(process.env.SCHEDULER_BATCH_SIZE) || 20;

let timer = null;

async function processDueBatch() {
    const now = new Date();
    try {
        const due = await UserList.find({
            scheduled: true,
            emailSent: false,
            scheduledAt: { $lte: now },
        }).limit(BATCH_SIZE);

        for (const u of due) {
            // try to claim the record atomically
            const claimed = await UserList.findOneAndUpdate(
                { _id: u._id, emailSent: false, processing: { $ne: true } },
                { $set: { processing: true } },
                { new: true }
            );
            if (!claimed) continue; // someone else is processing

            try {
                try {
                    await sendNodemailerEmail(
                        claimed.email,
                        claimed.name || "User"
                    );
                } catch (err) {
                    console.error(
                        "Worker: nodemailer failed for",
                        claimed.email,
                        err?.message || err
                    );
                    // fallback to Mailgun
                    await sendCustomEmail(
                        claimed.email,
                        claimed.name || "User"
                    );
                    console.log(
                        "Worker: fallback mailgun success for",
                        claimed.email
                    );
                }

                claimed.emailSent = true;
                claimed.emailSentAt = new Date();
                claimed.scheduled = false;
                claimed.scheduledAt = null;
                claimed.processing = false;
                claimed.lastError = null;
                claimed.sendAttempts = (claimed.sendAttempts || 0) + 1;
                await claimed.save();
                console.log("Worker: sent scheduled email to", claimed.email);
            } catch (err) {
                console.error(
                    "Worker: failed to send for",
                    claimed.email,
                    err?.message || err
                );
                claimed.processing = false;
                claimed.sendAttempts = (claimed.sendAttempts || 0) + 1;
                claimed.lastError = err?.message || String(err);
                await claimed.save();
            }
        }
    } catch (err) {
        console.error("Worker: error processing due batch:", err);
    }
}

export function startScheduledEmailWorker() {
    if (process.env.SCHEDULER_ENABLED === "false") {
        console.log(
            "Scheduled email worker disabled via SCHEDULER_ENABLED=false"
        );
        return;
    }
    if (timer) return; // already started
    console.log(
        "Starting scheduled email worker, poll interval:",
        POLL_INTERVAL
    );
    timer = setInterval(processDueBatch, POLL_INTERVAL);
    // run immediately once
    processDueBatch().catch((e) => console.error(e));
}

export function stopScheduledEmailWorker() {
    if (timer) clearInterval(timer);
    timer = null;
}
