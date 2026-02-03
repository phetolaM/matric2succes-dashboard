import mongoose from "mongoose";
import { subjectsDbConnection } from "../config/SubjectConnectionDB/subjectsDB.js";

const subjectSchema = new mongoose.Schema({
    name: { type: String, required: true },
    isLanguage: { type: Boolean, required: true },
});

// This uses the "MatricSubjects" collection in "SubjectsList" DB
const Subject = subjectsDbConnection.model(
    "MatricSubject",
    subjectSchema,
    "MatricSubjects"
);

export default Subject;
