import mongoose from "mongoose";

const universityApplicationSchema = new mongoose.Schema(
    {
        universityName: { type: String, default: "" },
        appliedDate: { type: Date, default: null },
        universityPIN: { type: String, default: "" },
        studentNumber: { type: String, default: "" },
        universityPassword: { type: String, default: "" },
        progressStatus: {
            type: String,
            enum: ["Done", "Pending", "Not Started"],
            default: "Not Started",
        },
        applicationResult: {
            type: String,
            enum: ["", "Accepted", "Rejected"],
            default: "",
        },
        rejectionReason: { type: String, default: "" },
    },
    { _id: false },
);

const applicationAssistanceSchema = new mongoose.Schema(
    {
        fullName: { type: String, required: true },
        email: { type: String, required: true },
        phoneNumber: { type: String, default: "" },
        planId: { type: String, default: "" },
        planName: { type: String, default: "" },
        studentProgress: {
            type: String,
            enum: ["Not Started", "In Progress", "Done"],
            default: "Not Started",
        },
        universities: [{ type: String }],
        universityApplications: [universityApplicationSchema],
        amount: { type: Number, default: 0 },
        currency: { type: String, default: "R" },
        paymentStatus: { type: String, default: "" },
        paymentMethod: { type: String, default: "" },
        paymentReference: { type: String, default: "" },
    },
    {
        timestamps: true,
        strict: false,
    },
);

export function getApplicationAssistanceModel(connection) {
    if (!connection) {
        throw new Error("getApplicationAssistanceModel requires a connection");
    }

    return (
        connection.models.ApplicationAssistance ||
        connection.model(
            "ApplicationAssistance",
            applicationAssistanceSchema,
            "applications",
        )
    );
}
