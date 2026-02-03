// models/universityModel.js
import mongoose from "mongoose";
import { universityDbConnection } from "../config/universityListDB/universityAddDB.js";

const campusSchema = new mongoose.Schema(
    {
        name: { type: String },
        location: { type: String },
    },
    { _id: false },
);

const universitySchema = new mongoose.Schema({
    title: { type: String, required: true },
    subtitle: { type: String, required: true },
    image: { type: String },
    history: { type: String }, // Kept for backward compatibility with existing data
    officialLink: { type: String },
    gallery: [String], // Kept for backward compatibility with existing data
    prospectus: [
        {
            name: { type: String },
            year: { type: Number },
            link: { type: String },
        },
    ],
    campusesList: [campusSchema],
    contact: {
        // Kept for backward compatibility with existing data
        address: { type: String },
        phone: { type: String },
        email: { type: String },
    },
    stats: {
        courses: { type: Number },
        campuses: { type: Number },
    },
    isApplicationOpen: { type: Boolean },
    applicationFee: { type: Number },
});

// ✅ Prevent OverwriteModelError
const University =
    universityDbConnection.models.universityDetails ||
    universityDbConnection.model("universityDetails", universitySchema);

export default University;
