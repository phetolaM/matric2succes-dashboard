/**
 * Script to update all NMU courses to set faculty = "Education"
 * Run with: node scripts/update-nmu-faculty.js
 */

const { getDbConnection } = require("@/lib/db/connection");
const { DATABASES } = require("@/lib/db/databases");

async function updateNMUFaculty() {
    try {
        console.log("Connecting to database...");
        const conn = await getDbConnection(DATABASES.UNIVERSITY_COURSES);
        const collection = conn.collection("nmu");

        console.log("Updating all NMU courses to faculty = 'Education'...");
        const result = await collection.updateMany(
            {},
            { $set: { faculty: "Education" } },
        );

        console.log(`✓ Successfully updated ${result.modifiedCount} course(s)`);
        console.log(`✓ Matched ${result.matchedCount} course(s)`);

        process.exit(0);
    } catch (err) {
        console.error("Failed to update courses:", err);
        process.exit(1);
    }
}

updateNMUFaculty();
