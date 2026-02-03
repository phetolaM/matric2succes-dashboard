import mongoose from "mongoose";

// Follow the same pattern as other DB connectors: create an empty connection
// instance and open the URI explicitly. This allows awaiting the openUri
// promise so callers can rely on the DB being ready when the function resolves.
let emailInboxConnection = null;

export const createEmailInboxConnection = async () => {
    if (emailInboxConnection) return emailInboxConnection;

    // create connection instance (not yet connected)
    emailInboxConnection = mongoose.createConnection();

    try {
        await emailInboxConnection.openUri(process.env.MONGO_URI, {
            dbName: "EmailInbox",
        });
        console.log("✅ MongoDB connected to EmailInbox database");
        return emailInboxConnection;
    } catch (error) {
        console.error("❌ EmailInbox DB error:", error.message);
        // keep behavior consistent with other connectors: exit on critical DB errors
        process.exit(1);
    }
};

export { emailInboxConnection };
