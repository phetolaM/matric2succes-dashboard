import mongoose, { Mongoose } from "mongoose";

// Create a separate connection instance
const subjectsDbConnection = mongoose.createConnection();

export const connectSubjectsDB = async () => {
    try {
        await subjectsDbConnection.openUri(process.env.MONGO_URI, {
            dbName: "SubjectsList", // ✅ this is your target DB
        });
        console.log("✅ MongoDB connected to SubjectsList database");
        return subjectsDbConnection;
    } catch (error) {
        console.error("❌ Subjects DB error:", error.message);
        process.exit(1);
    }
};

export { subjectsDbConnection };
