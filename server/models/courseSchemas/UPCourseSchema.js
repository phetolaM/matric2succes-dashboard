import mongoose from "mongoose";

// UP (University of Pretoria) Course Schema
const UPCourseSchema = new mongoose.Schema(
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

        // APS Requirements (UP uses best 6 subjects)
        apsRequirement: {
            type: Number,
            required: true,
        },
        apsRequirementMathematics: {
            type: Number,
        },
        apsRequirementMathLit: {
            type: Number,
        },
        apsRequirementTechnicalMath: {
            type: Number,
        },

        // Language Requirements
        homeLanguageRequirement: {
            subjectId: {
                type: String, // "all" or specific subject ID
            },
            percentage: {
                type: Number,
                min: 0,
                max: 100,
            },
        },
        additionalLanguageRequirement: {
            subjectId: {
                type: String, // "all" or specific subject ID
            },
            percentage: {
                type: Number,
                min: 0,
                max: 100,
            },
        },

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

        // UP-Specific Fields
        upExtraInfo: {
            type: String,
            trim: true,
        },
        // Add any other UP-specific fields here
        faculty: {
            type: String,
            trim: true,
        },
        admissionPointScore: {
            type: Number,
        },
        minimumSubjects: {
            type: Number,
            default: 6, // UP uses best 6 subjects
        },
    },
    {
        timestamps: true,
        collection: "up", // Explicitly set collection name
    }
);

// Indexes for better query performance
UPCourseSchema.index({ courseName: 1 });
UPCourseSchema.index({ courseCode: 1 });
UPCourseSchema.index({ apsRequirement: 1 });

export default UPCourseSchema;
