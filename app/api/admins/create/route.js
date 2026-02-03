import { NextResponse } from "next/server";
import { getDbConnection } from "@/lib/db/connection";
import { DATABASES } from "@/lib/db/databases";
import { getAdminCredentialModel } from "@/lib/models/adminCredential";
import bcrypt from "bcryptjs";

export async function POST(request) {
    try {
        const body = await request.json();
        const { email, password, role } = body || {};

        if (!email || !password) {
            return NextResponse.json(
                { error: "Email and password required" },
                { status: 400 },
            );
        }

        const conn = await getDbConnection(DATABASES.ADMIN);
        const AdminCredential = getAdminCredentialModel(conn);

        // Check if admin already exists
        const existing = await AdminCredential.findOne({ email });
        if (existing) {
            return NextResponse.json(
                { error: "Admin with this email already exists" },
                { status: 409 },
            );
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        const newAdmin = new AdminCredential({
            email: email.trim().toLowerCase(),
            password: hashedPassword,
            role: role || "admin",
        });

        await newAdmin.save();
        console.log("New admin created:", email);

        return NextResponse.json(
            { _id: newAdmin._id, email: newAdmin.email, role: newAdmin.role },
            { status: 201 },
        );
    } catch (err) {
        console.error("Create admin error:", err);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}
