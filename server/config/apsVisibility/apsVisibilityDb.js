import mongoose from "mongoose";

const apsVisibilityDbConnection = mongoose.createConnection();

export const connectApsVisibilityDB = async () => {
    try {
        await apsVisibilityDbConnection.openUri(process.env.MONGO_URI, {
            dbName: "apsVisibility",
        });
        console.log("✅ Connected to apsVisibility DB");
        return apsVisibilityDbConnection;
    } catch (err) {
        console.error("❌ apsVisibility DB connection failed:", err.message);
        process.exit(1);
    }
};

export { apsVisibilityDbConnection };
