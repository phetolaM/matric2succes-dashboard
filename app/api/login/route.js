import { NextResponse } from "next/server";
import { getDbConnection } from "../../../lib/db/connection";
import { DATABASES } from "../../../lib/db/databases";
import { getAdminCredentialModel } from "../../../lib/models/adminCredential";
import bcrypt from "bcryptjs";
import { createSession } from "../../../lib/auth/session";

export async function POST(request) {
    try {
        const body = await request.json();
        let { email, password } = body || {};

        if (!email || !password) {
            return NextResponse.json(
                { error: "Email and password required" },
                { status: 400 },
            );
        }

        // Normalize inputs
        email = String(email).trim().toLowerCase();
        password = String(password).trim();

        const conn = await getDbConnection(DATABASES.ADMIN);
        console.log("Login attempt for:", email);

        // Find by email, then compare hashed password
        const AdminCredential = getAdminCredentialModel(conn);
        const admin = await AdminCredential.findOne({ email }).lean();
        if (admin) {
            const isValid = await bcrypt.compare(password, admin.password);
            if (isValid) {
                console.log("credential found");
                const { token, maxAge } = createSession({
                    sub: admin._id,
                    email: admin.email,
                    role: admin.role || "admin",
                });

                const res = NextResponse.json({ ok: true }, { status: 200 });
                res.cookies.set("session", token, {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === "production",
                    sameSite: "strict",
                    path: "/",
                    maxAge,
                });
                return res;
            }
        }

        console.log("No matching admin or invalid password for:", email);
        return NextResponse.json(
            { error: "Invalid credentials" },
            { status: 401 },
        );
    } catch (err) {
        console.error("Login route error:", err);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}
