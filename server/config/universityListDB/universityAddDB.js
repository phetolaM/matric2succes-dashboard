import mongoose2 from "mongoose";

// Create a separate connection instance
const universityDbConnection = mongoose2.createConnection();

export const connectUniversityDB = async () => {
    try {
        await universityDbConnection.openUri(process.env.MONGO_URI, {
            dbName: "universityDataInformation",
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log("✅ MongoDB connected to universityDataInformation database");
        return universityDbConnection;
    } catch (error) {
        console.error("error");
        console.error("❌ University DB error:", error.message);
        process.exit(1);
    }
};

export { universityDbConnection };