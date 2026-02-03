import mongoose from "mongoose";

const EmailSchema = new mongoose.Schema(
    {
        name: { type: String, required: false },
        email: { type: String, required: false },
        subject: { type: String, required: false },
        message: { type: String, required: false },
        receivedAt: { type: Date, default: Date.now },
        ip: { type: String, required: false },
    },
    { collection: "MyEmails" },
);

export function getEmailModel(connection) {
    if (!connection) throw new Error("getEmailModel requires a connection");
    try {
        return connection.model("EmailMessage");
    } catch (e) {
        // If model doesn't exist yet, create it
        return connection.model("EmailMessage", EmailSchema, "MyEmails");
    }
}
