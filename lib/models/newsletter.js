import mongoose from "mongoose";

const newsletterSchema = new mongoose.Schema(
    {
        email: {
            type: String,
            required: true,
            unique: true,
        },
        subscribedAt: {
            type: Date,
            default: Date.now,
        },
    },
    { collection: "subscribers" },
);

export function getNewsletterModel(connection) {
    if (!connection)
        throw new Error("getNewsletterModel requires a connection");
    try {
        return connection.model("NewsletterSubscriber");
    } catch (e) {
        return connection.model(
            "NewsletterSubscriber",
            newsletterSchema,
            "subscribers",
        );
    }
}
