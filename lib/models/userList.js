import mongoose from "mongoose";

const userListSchema = new mongoose.Schema(
    {
        userNumber: { type: Number, index: true, sparse: true },
        name: { type: String, required: true },
        email: { type: String, required: true },
        ipAddress: { type: String, default: null },
        realLocation: {
            country: { type: String },
            province: { type: String },
            city: { type: String },
        },
        visits: [
            {
                date: { type: Date },
                ip: { type: String, default: null },
                ipAddress: { type: String, default: null },
            },
        ],
        country: { type: String, default: null },
        countryCode: { type: String, default: null },
        province: { type: String, default: null },
        emailSent: { type: Boolean, default: false },
        emailSentAt: { type: Date, default: null },
        scheduled: { type: Boolean, default: false },
        scheduledAt: { type: Date, default: null },
        processing: { type: Boolean, default: false },
        sendAttempts: { type: Number, default: 0 },
        lastError: { type: String, default: null },
    },
    { strict: false },
);

export function getUserListModel(connection) {
    if (!connection) throw new Error("getUserListModel requires a connection");
    return (
        connection.models.UserListDetails ||
        connection.model("UserListDetails", userListSchema, "UserListDetails")
    );
}
