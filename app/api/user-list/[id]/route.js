import { NextResponse } from "next/server";
import { getDbConnection } from "../../../../lib/db/connection";
import { DATABASES } from "../../../../lib/db/databases";
import { getUserListModel } from "../../../../lib/models/userList";
import mongoose from "mongoose";

export async function DELETE(request, { params }) {
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

        let deleted = null;
        try {
            deleted = await UserList.findByIdAndDelete(id);
        } catch (castErr) {
            // Handle invalid ObjectId formats gracefully
            if (castErr?.name === "CastError") {
                return NextResponse.json(
                    { error: "Invalid user ID" },
                    { status: 400 },
                );
            }
            throw castErr;
        }

        if (!deleted) {
            return NextResponse.json(
                { error: "User not found" },
                { status: 404 },
            );
        }

        console.log("User deleted:", deleted.email || deleted._id);
        return NextResponse.json({ success: true }, { status: 200 });
    } catch (err) {
        console.error("Delete user error:", err);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}
