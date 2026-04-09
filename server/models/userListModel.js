import mongoose from "mongoose";

import { userListDbConnection } from "../config/userListDB/userListDB.js";

const userListSchema = new mongoose.Schema({
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
    // Email-related fields to support one-off sending & scheduling
    emailSent: { type: Boolean, default: false },
    emailSentAt: { type: Date, default: null },
    scheduled: { type: Boolean, default: false },
    scheduledAt: { type: Date, default: null },
    // Scheduling/processing helpers
    processing: { type: Boolean, default: false },
    sendAttempts: { type: Number, default: 0 },
    lastError: { type: String, default: null },
});

// This uses the "ApsCalculatorUsers" collection in "userList" DB
const UserList = userListDbConnection.model(
    "UserListDetail",
    userListSchema,
    "UserListDetails",
);

export default UserList;
