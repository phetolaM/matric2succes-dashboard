import mongoose from "mongoose";

const LanguageRequirementSchema = new mongoose.Schema(
    {
        subjectId: { type: String, required: false },
        percentage: { type: Number, required: false },
    },
    { _id: false },
);

const SubjectRequirementSchema = new mongoose.Schema(
    {
        subjectId: { type: String, required: true },
        percentage: { type: Number, required: false },
    },
    { _id: false },
);

const AdditionalRequirementSchema = new mongoose.Schema(
    {
        count: { type: Number, required: true },
        level: { type: Number, required: true },
        note: { type: String, required: false },
    },
    { _id: false },
);

const DUTCourseSchema = new mongoose.Schema(
    {
        courseName: { type: String, required: true, trim: true },
        courseCode: { type: String, trim: true },
        faculty: { type: String, trim: true },
        qualificationLevel: { type: String, trim: true },
        duration: { type: String, trim: true },
        methodOfStudy: { type: String, trim: true },
        careerChoices: { type: [String], default: [] },
        apsRequirement: { type: Number },
        languageRequirements: {
            type: [
                {
                    subjectId: { type: String },
                    homeLanguagePercentage: { type: Number, min: 0, max: 100 },
                    additionalLanguagePercentage: {
                        type: Number,
                        min: 0,
                        max: 100,
                    },
                },
            ],
            default: [],
        },
        // When both home and additional language requirements are present,
        // this operator controls whether the admin intended BOTH to be
        // required (default) or EITHER (home OR additional) to be met.
        languageRequirementOperator: {
            type: String,
            enum: ["either", "both"],
            default: "both",
        },
        subjectRequirements: {
            type: [
                {
                    subjectId: { type: String, required: true },
                    percentage: { type: Number, min: 0, max: 100 },
                },
            ],
            default: [],
        },
        subjectRequirementGroups: {
            type: [
                [
                    {
                        subjectId: { type: String, required: true },
                        percentage: { type: Number, min: 0, max: 100 },
                    },
                ],
            ],
            default: [],
        },
        // Subject combination groups: outer array is OR, inner arrays are
        // combinations that must ALL be met (AND). Example: [[A,B], [C,D]]
        // means (A AND B) OR (C AND D).
        subjectCombinationGroups: {
            type: [
                [
                    {
                        subjectId: { type: String, required: true },
                        percentage: { type: Number, min: 0, max: 100 },
                    },
                ],
            ],
            default: [],
        },
        additionalRequirementsSpecialActive: { type: Boolean, default: false },
        additionalRequirementsSpecialCount: { type: Number, min: 1, max: 7 },
        additionalRequirementsSpecialMinPercentage: {
            type: Number,
            min: 0,
            max: 100,
        },
        additionalRequirementsSpecialIncludeLO: { type: Boolean },
        additionalRequirementsSpecialLanguageRule: {
            type: String,
            enum: ["none", "max1", "any"],
        },
    },
    { timestamps: true, collection: "dut" },
);

DUTCourseSchema.index({ courseName: 1 });
DUTCourseSchema.index({ apsRequirement: 1 });

export default DUTCourseSchema;
