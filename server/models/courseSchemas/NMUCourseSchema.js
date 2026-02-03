import mongoose from "mongoose";

const NMUCourseSchema = new mongoose.Schema(
    {
        majoring: { type: String, trim: true },
        // Qualification level: higher certificate, diploma or bachelor
        level: {
            type: String,
            enum: ["higher certificate", "diploma", "bachelor"],
            required: false,
        },
        courseName: { type: String, required: true, trim: true },
        faculty: { type: String, trim: true },
        duration: { type: String, trim: true },
        methodOfStudy: { type: String, trim: true },
        careerChoices: { type: [String], default: [] },
        apsRequirement: { type: Number },
        // Optional APS overrides per math type
        apsRequirementMathematics: { type: Number },
        apsRequirementMathLit: { type: Number },
        apsRequirementTechnicalMath: { type: Number },

        // Language Requirements - Multiple languages with different requirements for home vs additional
        languageRequirements: [
            {
                subjectId: {
                    type: String,
                    required: true, // Specific language subject ID
                },
                homeLanguagePercentage: {
                    type: Number,
                    min: 0,
                    max: 100,
                },
                additionalLanguagePercentage: {
                    type: Number,
                    min: 0,
                    max: 100,
                },
            },
        ],

        // Subject Requirements (AND logic)
        subjectRequirements: [
            {
                subjectId: {
                    type: String,
                    required: true,
                },
                percentage: {
                    type: Number,
                    required: true,
                    min: 0,
                    max: 100,
                },
            },
        ],

        // Subject Requirement Groups (OR logic within groups)
        subjectRequirementGroups: [
            [
                {
                    subjectId: {
                        type: String,
                        required: true,
                    },
                    percentage: {
                        type: Number,
                        required: true,
                        min: 0,
                        max: 100,
                    },
                },
            ],
        ],

        // Disqualifying subjects (Not Applicable Subjects)
        notApplicableSubjects: {
            type: [String],
            default: [],
        },

        additionalRequirements: {
            type: [
                {
                    count: { type: Number, min: 1, max: 5 },
                    level: { type: Number, min: 1, max: 7 },
                    note: { type: String },
                },
            ],
            default: [],
        },
    },
    { timestamps: true, collection: "nmu" },
);

NMUCourseSchema.index({ courseName: 1 });
NMUCourseSchema.index({ apsRequirement: 1 });

export default NMUCourseSchema;
