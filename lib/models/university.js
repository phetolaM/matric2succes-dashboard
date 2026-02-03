import mongoose from "mongoose";

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
    history: { type: String },
    officialLink: { type: String },
    gallery: [String],
    prospectus: {
        name: { type: String },
        year: { type: Number },
        link: { type: String },
    },
    campusesList: [campusSchema],
    contact: {
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

export function getUniversityModel(connection) {
    if (!connection)
        throw new Error("getUniversityModel requires a connection");
    try {
        return connection.model("universityDetails");
    } catch (e) {
        return connection.model("universityDetails", universitySchema);
    }
}
