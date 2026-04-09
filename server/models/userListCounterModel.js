import mongoose from "mongoose";

import { userListDbConnection } from "../config/userListDB/userListDB.js";

export const USER_LIST_COUNTER_KEY = "historicalUserCount";
export const USER_LIST_BASELINE_COUNT = 678;

const userListCounterSchema = new mongoose.Schema(
    {
        key: { type: String, required: true, unique: true },
        value: {
            type: Number,
            required: true,
            default: USER_LIST_BASELINE_COUNT,
        },
    },
    { strict: true, timestamps: true },
);

const UserListCounter =
    userListDbConnection.models.UserListCounter ||
    userListDbConnection.model(
        "UserListCounter",
        userListCounterSchema,
        "UserListCounter",
    );

export default UserListCounter;
