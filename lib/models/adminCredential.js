import mongoose from "mongoose";

const adminCredentialSchema = new mongoose.Schema(
    {
        email: { type: String, required: true, unique: true },
        password: { type: String, required: true },
        role: { type: String, default: "admin" },
    },
    { timestamps: true },
);

export function getAdminCredentialModel(connection) {
    if (!connection)
        throw new Error("getAdminCredentialModel requires a connection");
    return (
        connection.models.adminCredential ||
        connection.model(
            "adminCredential",
            adminCredentialSchema,
            "adminCredential",
        )
    );
}
