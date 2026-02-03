import mongoose from "mongoose";

// Define the schema for the admin credentials
const adminCredentialSchema = new mongoose.Schema(
    {
        email: {
            type: String,
            required: true,
            unique: true,
        },
        password: {
            type: String,
            required: true,
        },
        role: {
            type: String,
            default: "admin",
        },
    },
    { timestamps: true }
); // <-- Add this line

// Create the model and explicitly specify the collection name
const AdminCredential = mongoose.model(
    "adminCredential",
    adminCredentialSchema,
    "adminCredential"
); // Specify the collection name here

export default AdminCredential;
