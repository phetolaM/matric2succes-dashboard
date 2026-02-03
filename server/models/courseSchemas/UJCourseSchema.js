import mongoose from "mongoose";

// UJ (University of Johannesburg) Course Schema
const UJCourseSchema = new mongoose.Schema(
    {
        // Basic Course Information
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
        duration: {
            type: String,
            trim: true,
        },
        methodOfStudy: {
            type: String,
            enum: ["Full-time", "Part-time", "Distance", "Online", "Hybrid"],
        },
        campuses: [
            {
                type: String,
                trim: true,
            },
        ],
        careerChoices: [
            {
                type: String,
                trim: true,
            },
        ],

        // APS Requirements - At least one must be provided
        apsRequirement: {
            type: Number,
            min: 0,
        },
        apsRequirementMathematics: {
            type: Number,
            min: 0,
        },
        apsRequirementMathLit: {
            type: Number,
            min: 0,
        },
        apsRequirementTechnicalMath: {
            type: Number,
            min: 0,
        },

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

        // Not Applicable Subjects - Subjects that disqualify students from the course
        notApplicableSubjects: [
            {
                type: String, // Subject IDs
            },
        ],

        // UJ-Specific Fields
    },
    {
        timestamps: true,
        collection: "uj", // Explicitly set collection name
    }
);

// Indexes for better query performance
UJCourseSchema.index({ courseName: 1 });
UJCourseSchema.index({ courseCode: 1 });
UJCourseSchema.index({ apsRequirement: 1 });

export default UJCourseSchema;
