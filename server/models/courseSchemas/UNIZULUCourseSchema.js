import mongoose from "mongoose";

// UNIZULU (University of Zululand) Course Schema
const UNIZULUCourseSchema = new mongoose.Schema(
    {
        courseName: {
            type: String,
            required: true,
            trim: true,
        },
        courseCode: {
            type: String,
            required: true,
            trim: true,
        },
        majoring: {
            type: String,
            trim: true,
        },
        level: {
            type: String,
            enum: ["Higher Certificate", "Diploma", "Bachelor"],
            default: "Bachelor",
        },
        duration: {
            type: String,
            trim: true,
        },
        careerChoices: [
            {
                type: String,
                trim: true,
            },
        ],

        // APS Requirements
        apsRequirement: {
            type: Number,
            min: 0,
        },

        // Explicit single-language requirement objects (used by admin forms)
        homeLanguageRequirement: {
            subjectId: { type: String },
            percentage: { type: Number, min: 0, max: 100 },
        },
        additionalLanguageRequirement: {
            subjectId: { type: String },
            percentage: { type: Number, min: 0, max: 100 },
        },

        // Subject Requirements (AND)
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

        // Subject Requirement Groups (OR within groups)
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

        // Optional: Combinations of requirements. Each combination represents
        // an alternative path where meeting all requirements inside any single
        // combination qualifies the applicant. Backwards-compatible: courses
        // without this field continue to use top-level subjectRequirements and
        // subjectRequirementGroups.
        subjectRequirementCombinations: [
            {
                name: { type: String, trim: true },
                subjectRequirements: [
                    {
                        subjectId: { type: String, required: true },
                        percentage: {
                            type: Number,
                            required: true,
                            min: 0,
                            max: 100,
                        },
                    },
                ],
                subjectRequirementGroups: [
                    [
                        {
                            subjectId: { type: String, required: true },
                            percentage: {
                                type: Number,
                                required: true,
                                min: 0,
                                max: 100,
                            },
                        },
                    ],
                ],
            },
        ],

        // Optional flags for university-specific logic (backwards-compatible)
    },
    {
        timestamps: true,
        collection: "unizulu",
    }
);

UNIZULUCourseSchema.index({ courseName: 1 });
UNIZULUCourseSchema.index({ courseCode: 1 });

export default UNIZULUCourseSchema;
