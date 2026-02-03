import mongoose from "mongoose";

let isConnected = false; // connection state across hot reloads

export async function connectAdminDB() {
    if (isConnected) {
        console.log("admindb connected");
        return mongoose;
    }

    const uri = process.env.MONGO_URI;
    if (!uri) {
        throw new Error("Missing MONGO_URI in environment");
    }

    try {
        await mongoose.connect(uri, {
            dbName: "adminCredentials",
        });
        isConnected = true;
        console.log("admindb connected");
        return mongoose;
    } catch (err) {
        console.error("❌ Admin DB connect error:", err.message);
        throw err;
    }
}
