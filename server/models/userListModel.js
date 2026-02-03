import mongoose from "mongoose";

import { userListDbConnection } from "../config/userListDB/userListDB.js";

const userListSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true },
    visits: [{ type: Date, required: true }], // Array of visit dates
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
    "UserListDetails"
);

export default UserList;
