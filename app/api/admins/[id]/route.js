import { NextResponse } from "next/server";
import { getDbConnection } from "@/lib/db/connection";
import { DATABASES } from "@/lib/db/databases";
import { getAdminCredentialModel } from "@/lib/models/adminCredential";
import mongoose from "mongoose";

export async function PATCH(request, { params }) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { email } = body || {};

        if (!email) {
            return NextResponse.json(
                { error: "Email required" },
                { status: 400 },
            );
        }

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return NextResponse.json(
                { error: "Invalid admin ID" },
                { status: 400 },
            );
        }

        const conn = await getDbConnection(DATABASES.ADMIN);
        const AdminCredential = getAdminCredentialModel(conn);

        // Check if another admin already has this email
        const existing = await AdminCredential.findOne({
            email: email.trim().toLowerCase(),
            _id: { $ne: id },
        });

        if (existing) {
            return NextResponse.json(
                { error: "Email already in use" },
                { status: 409 },
            );
        }

        const updated = await AdminCredential.findByIdAndUpdate(
            id,
            { email: email.trim().toLowerCase() },
            { new: true },
        ).select("-password");

        if (!updated) {
            return NextResponse.json(
                { error: "Admin not found" },
                { status: 404 },
            );
        }

        console.log("Admin updated:", email);
        return NextResponse.json(updated, { status: 200 });
    } catch (err) {
        console.error("Update admin error:", err);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}
