import { NextResponse } from "next/server";
import { getDbConnection } from "../../../../lib/db/connection";
import { DATABASES } from "../../../../lib/db/databases";
import { getUserListModel } from "../../../../lib/models/userList";
import { sendEmail } from "../../../../lib/email/sendEmail";

export const runtime = "nodejs";

/**
 * Process due scheduled emails.
 * This endpoint can be called manually or via a cron job to send scheduled emails.
 */
export async function POST() {
    try {
        const conn = await getDbConnection(DATABASES.USER_LIST);
        const UserList = getUserListModel(conn);

        const now = new Date();
        const BATCH_SIZE = 20;

        // Find due scheduled emails
        const dueUsers = await UserList.find({
            scheduled: true,
            emailSent: false,
            scheduledAt: { $lte: now },
            processing: { $ne: true },
        }).limit(BATCH_SIZE);

        if (dueUsers.length === 0) {
            return NextResponse.json(
                { message: "No due emails to process", processed: 0 },
                { status: 200 }
            );
        }

        const results = {
            processed: 0,
            succeeded: 0,
            failed: 0,
            errors: [],
        };

        for (const user of dueUsers) {
            try {
                // Atomically claim the record
                const claimed = await UserList.findOneAndUpdate(
                    { _id: user._id, emailSent: false, processing: { $ne: true } },
                    { $set: { processing: true } },
                    { new: true }
                );

                if (!claimed) continue; // Already being processed

                results.processed++;

                try {
                    // Send the email
                    await sendEmail(claimed.email, claimed.name || "User");

                    // Mark as sent
                    claimed.emailSent = true;
                    claimed.emailSentAt = new Date();
                    claimed.scheduled = false;
                    claimed.scheduledAt = null;
                    claimed.processing = false;
                    claimed.lastError = null;
                    claimed.sendAttempts = (claimed.sendAttempts || 0) + 1;
                    await claimed.save();

                    results.succeeded++;
                    console.log("Scheduled email sent to:", claimed.email);
                } catch (emailErr) {
                    // Mark as failed but allow retry
                    claimed.processing = false;
                    claimed.sendAttempts = (claimed.sendAttempts || 0) + 1;
                    claimed.lastError = emailErr?.message || String(emailErr);
                    await claimed.save();

                    results.failed++;
                    results.errors.push({
                        email: claimed.email,
                        error: emailErr?.message || "Unknown error",
                    });
                    console.error("Failed to send scheduled email to:", claimed.email, emailErr);
                }
            } catch (err) {
                console.error("Error processing user:", user.email, err);
                results.failed++;
                results.errors.push({
                    email: user.email,
                    error: err?.message || "Unknown error",
                });
            }
        }

        return NextResponse.json({
            message: `Processed ${results.processed} due emails`,
            ...results,
        }, { status: 200 });
    } catch (err) {
        console.error("Scheduled email processor error:", err);
        return NextResponse.json(
            { error: "Server error", details: err?.message },
            { status: 500 }
        );
    }
}
