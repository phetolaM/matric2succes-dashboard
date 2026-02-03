import { NextResponse } from "next/server";
import { getDbConnection } from "../../../../../lib/db/connection";
import { DATABASES } from "../../../../../lib/db/databases";
import { getUserListModel } from "../../../../../lib/models/userList";
import { sendEmail } from "../../../../../lib/email/sendEmail";
import mongoose from "mongoose";

export const runtime = "nodejs";

export async function POST(request, { params }) {
    try {
        const { id } = await params;
        if (!id || typeof id !== "string") {
            return NextResponse.json(
                { error: "Missing user ID" },
                { status: 400 },
            );
        }

        const conn = await getDbConnection(DATABASES.USER_LIST);
        const UserList = getUserListModel(conn);

        let user = null;
        try {
            user = await UserList.findById(id);
        } catch (castErr) {
            if (castErr?.name === "CastError") {
                return NextResponse.json(
                    { error: "Invalid user ID" },
                    { status: 400 },
                );
            }
            throw castErr;
        }

        if (!user) {
            return NextResponse.json(
                { error: "User not found" },
                { status: 404 },
            );
        }

        if (user.emailSent) {
            return NextResponse.json(
                { message: "Email already sent" },
                { status: 200 },
            );
        }

        // Actually send the email
        try {
            console.log("Attempting to send email to:", user.email, "Name:", user.name);
            await sendEmail(user.email, user.name || "User");
            console.log("✅ Email sent successfully to:", user.email);
        } catch (emailErr) {
            console.error("❌ Failed to send email:", emailErr);
            return NextResponse.json(
                { error: "Failed to send email: " + (emailErr.message || "Unknown error") },
                { status: 500 },
            );
        }

        // Update using findByIdAndUpdate to avoid Mongoose validation issues
        console.log("Updating user record for:", user.email);
        console.log("Current state - emailSent:", user.emailSent, "scheduled:", user.scheduled);
        
        try {
            const updated = await UserList.findByIdAndUpdate(
                id,
                {
                    $set: {
                        emailSent: true,
                        emailSentAt: new Date(),
                        scheduled: false,
                        scheduledAt: null,
                        processing: false,
                    },
                },
                { new: true }
            );
            
            if (!updated) {
                return NextResponse.json(
                    { error: "Failed to update user record" },
                    { status: 500 },
                );
            }
            
            console.log("✅ User record updated successfully for:", updated.email);
            return NextResponse.json({ success: true, message: "Email sent successfully" }, { status: 200 });
        } catch (updateErr) {
            console.error("❌ Failed to update user record:", updateErr);
            console.error("Update error details:", JSON.stringify(updateErr, null, 2));
            return NextResponse.json(
                { error: "Email sent but failed to update record: " + (updateErr.message || "Unknown error") },
                { status: 500 },
            );
        }
    } catch (err) {
        console.error("Send now error:", err);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}
