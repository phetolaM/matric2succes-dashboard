import mongoose from "mongoose";

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

export function getUserListCounterModel(connection) {
    if (!connection) {
        throw new Error("getUserListCounterModel requires a connection");
    }

    return (
        connection.models.UserListCounter ||
        connection.model(
            "UserListCounter",
            userListCounterSchema,
            "UserListCounter",
        )
    );
}
