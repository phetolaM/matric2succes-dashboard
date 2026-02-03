import mongoose from "mongoose";

let emailInboxConnection = null;

export async function createEmailInboxConnection() {
    if (emailInboxConnection) return emailInboxConnection;

    try {
        emailInboxConnection = mongoose.createConnection();
        await emailInboxConnection.openUri(process.env.MONGO_URI, {
            dbName: "EmailInbox",
        });
        console.log("✅ MongoDB connected to EmailInbox database");
        return emailInboxConnection;
    } catch (error) {
        console.error("❌ EmailInbox DB error:", error.message);
        throw error;
    }
}

export function getEmailInboxConnection() {
    return emailInboxConnection;
}
