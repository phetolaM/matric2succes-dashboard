import mongoose from "mongoose";

let model;

export function getApsVisibilityModel(conn) {
    if (model) return model;

    const schema = new mongoose.Schema(
        {
            code: { type: String, required: true, unique: true },
            displayName: { type: String },
            enabled: { type: Boolean, default: true },
            updatedAt: { type: Date, default: Date.now },
        },
        { collection: "visibility" },
    );

    model = conn.model("ApsVisibility", schema);
    return model;
}
