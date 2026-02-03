import mongoose from "mongoose";

const subjectSchema = new mongoose.Schema({
    name: { type: String, required: true },
    isLanguage: { type: Boolean, required: true },
});

export function getSubjectModel(connection) {
    if (!connection) throw new Error("getSubjectModel requires a connection");
    return (
        connection.models.MatricSubject ||
        connection.model("MatricSubject", subjectSchema, "MatricSubjects")
    );
}
