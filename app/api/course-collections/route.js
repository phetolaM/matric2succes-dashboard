import { getDbConnection } from "@/lib/db/connection";
import { DATABASES } from "@/lib/db/databases";

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        const conn = await getDbConnection(DATABASES.UNIVERSITY_COURSES);
        const collections = await conn.db.listCollections().toArray();

        const collectionNames = collections
            .map((col) => col?.name)
            .filter(Boolean)
            .filter((name) => !name.startsWith("system."))
            .sort((a, b) => a.localeCompare(b));

        return Response.json(collectionNames);
    } catch (err) {
        console.error("Failed to fetch course collections:", err.message);
        return Response.json(
            { message: "Failed to fetch course collections" },
            { status: 500 },
        );
    }
}
