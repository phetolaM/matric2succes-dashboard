import mongoose from "mongoose";

let newsletterConnection = null;

export async function createNewsletterConnection() {
    if (newsletterConnection) return newsletterConnection;

    try {
        newsletterConnection = mongoose.createConnection();
        await newsletterConnection.openUri(process.env.MONGO_URI, {
            dbName: "newsLetterSubscription",
        });
        console.log("✅ MongoDB connected to newsLetterSubscription database");
        return newsletterConnection;
    } catch (error) {
        console.error("❌ Newsletter DB connection error:", error.message);
        throw error;
    }
}

export function getNewsletterConnection() {
    return newsletterConnection;
}
