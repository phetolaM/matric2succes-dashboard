import { getDbConnection } from "@/lib/db/connection";
import { DATABASES } from "@/lib/db/databases";

export const dynamic = "force-dynamic";

/**
 * POST /api/admin/update-nmu-faculty
 * Updates all NMU courses to set faculty = "Business & Economic Sciences"
 * This is a temporary admin endpoint
 */
export async function POST(request) {
    try {
        const conn = await getDbConnection(DATABASES.UNIVERSITY_COURSES);
        const collection = conn.collection("nmu");

        const result = await collection.updateMany(
            {},
            { $set: { faculty: "Business & Economic Sciences" } },
        );

        return Response.json(
            {
                message: "Faculty updated successfully",
                matchedCount: result.matchedCount,
                modifiedCount: result.modifiedCount,
            },
            { status: 200 },
        );
    } catch (err) {
        console.error("Failed to update NMU faculty:", err);
        return Response.json(
            { message: "Failed to update faculty", error: err.message },
            { status: 500 },
        );
    }
}
