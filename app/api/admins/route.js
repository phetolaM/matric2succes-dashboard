import { NextResponse } from "next/server";
import { getDbConnection } from "../../../lib/db/connection";
import { DATABASES } from "../../../lib/db/databases";
import { getAdminCredentialModel } from "../../../lib/models/adminCredential";

export async function GET() {
    try {
        const conn = await getDbConnection(DATABASES.ADMIN);
        const AdminCredential = getAdminCredentialModel(conn);

        const admins = await AdminCredential.find({})
            .select("-password")
            .lean();

        return NextResponse.json(admins, { status: 200 });
    } catch (err) {
        console.error("Fetch admins error:", err);
        return NextResponse.json(
            { error: "Failed to fetch admins" },
            { status: 500 },
        );
    }
}
