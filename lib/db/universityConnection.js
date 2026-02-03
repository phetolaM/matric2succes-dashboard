import mongoose from "mongoose";

let universityConnection = null;

export async function createUniversityConnection() {
    if (universityConnection) return universityConnection;

    try {
        universityConnection = mongoose.createConnection();
        await universityConnection.openUri(process.env.MONGO_URI, {
            dbName: "universityDataInformation",
        });
        console.log(
            "✅ MongoDB connected to universityDataInformation database",
        );
        return universityConnection;
    } catch (error) {
        console.error("❌ University DB connection error:", error.message);
        throw error;
    }
}

export function getUniversityConnection() {
    return universityConnection;
}
