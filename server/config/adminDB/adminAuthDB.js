import mongoose from "mongoose";

// Admin DB connection
export const connectAdminCredentialsDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI, {
            dbName: "adminCredentials",  // Specific database for admin
        });
        console.log("✅ MongoDB connected to adminCredentials database");
    } catch (error) {
        console.error("❌ Admin DB error:", error.message);
        process.exit(1);
    }
};
