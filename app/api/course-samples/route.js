import { getDbConnection } from "@/lib/db/connection";
import { DATABASES } from "@/lib/db/databases";

export const dynamic = "force-dynamic";

const TARGET_COLLECTIONS = [
    "uj",
    "wsu",
    "unisa",
    "nmu",
    "mut",
    "smu",
    "tut",
    "ukzn",
];

export async function GET() {
    try {
        const conn = await getDbConnection(DATABASES.UNIVERSITY_COURSES);
        const results = {};

        for (const collectionName of TARGET_COLLECTIONS) {
            try {
                const collection = conn.collection(collectionName);
                const sample = await collection.findOne({});
                results[collectionName] = sample || null;
            } catch (err) {
                console.error(
                    `Failed to fetch sample from ${collectionName}:`,
                    err.message,
                );
                results[collectionName] = null;
            }
        }

        return Response.json(results);
    } catch (err) {
        console.error("Failed to fetch course samples:", err.message);
        return Response.json(
            { message: "Failed to fetch course samples" },
            { status: 500 },
        );
    }
}
