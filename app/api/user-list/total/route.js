import { NextResponse } from "next/server";
import { getDbConnection } from "@/lib/db/connection";
import { DATABASES } from "@/lib/db/databases";
import { getUserListModel } from "@/lib/models/userList";
import { USER_LIST_BASELINE_COUNT } from "@/lib/models/userListCounter";

export const runtime = "nodejs";

export async function GET() {
    try {
        const conn = await getDbConnection(DATABASES.USER_LIST);
        const UserList = getUserListModel(conn);
        const currentDbUsers = await UserList.countDocuments();
        const historicalTotal = USER_LIST_BASELINE_COUNT + currentDbUsers;

        return NextResponse.json(
            {
                historicalTotal,
                currentDbUsers,
                nextUserNumber: historicalTotal + 1,
            },
            { status: 200 },
        );
    } catch (err) {
        console.error("User total fetch error:", err);
        return NextResponse.json(
            { error: "Failed to fetch user totals" },
            { status: 500 },
        );
    }
}
