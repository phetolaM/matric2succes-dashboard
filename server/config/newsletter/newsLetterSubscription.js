import mongoose from "mongoose";

// Create a separate connection instance for newsletters
export const newsletterDbConnection = mongoose.createConnection();

/**
 * Connects to the MongoDB database for newsletter subscriptions.
 * @returns {Promise<mongoose.Connection>} The established connection instance.
 */
export const connectNewsletterDB = async () => {
    try {
        await newsletterDbConnection.openUri(process.env.MONGO_URI, {
            dbName: "newsLetterSubscription", // target newsletter DB
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log("✅ MongoDB connected to newsLetterSubscription database");
        return newsletterDbConnection;
    } catch (error) {
        console.error("❌ Newsletter DB connection error:", error.message);
        process.exit(1);
    }
};

// Optionally export mongoose namespace bound to this connection,
// which you can use to define models on newsletterDbConnection
export const mongooseNewsletter = newsletterDbConnection;
