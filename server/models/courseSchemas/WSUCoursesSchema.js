import mongoose from "mongoose";

// UJ (University of Johannesburg) Course Schema
const WSUCourseSchema = new mongoose.Schema(
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

        // APS Requirements
        // At least one APS field should be provided (general or math-specific)
        apsRequirement: {
            type: Number,
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

        // WSU-Specific Fields
        ujSpecialField: {
            type: String,
            trim: true,
        },
        facultyCode: {
            type: String,
            trim: true,
        },
        departmentCode: {
            type: String,
            trim: true,
        },

        // Extended Course Program (ECP) Field
        // This flag indicates that the course has an Extended Programme variant
        // The extended course is NOT saved in the database but generated dynamically
        hasExtended: {
            type: Boolean,
            default: false,
        },

        // APS Requirement for Extended Program
        // If specified, this APS will be used for the extended course variant
        // If not specified, defaults to main APS - 1
        apsRequirementExtended: {
            type: Number,
            min: 0,
        },
        // Extended APS requirements by math subject type
        // These override apsRequirementExtended when the student has the specific math subject
        apsRequirementExtendedMathematics: {
            type: Number,
            min: 0,
        },
        apsRequirementExtendedMathLit: {
            type: Number,
            min: 0,
        },
        apsRequirementExtendedTechnicalMath: {
            type: Number,
            min: 0,
        },

        // Additional Subjects APS Requirement
        // For requirements like "Any other two additional subjects totalling 8 points"
        numAdditionalSubjects: {
            type: Number,
            min: 0,
        },
        totalApsForAdditionalSubjects: {
            type: Number,
            min: 0,
        },

        // Allow Life Orientation in remaining subjects and additional subjects
        // By default, Life Orientation is excluded from "remaining-subject" and N-subjects calculations
        // Set to true to include Life Orientation for specific courses
        allowLifeOrientation: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
        collection: "wsu", // Explicitly set collection name
    }
);

// Indexes for better query performance
WSUCourseSchema.index({ courseName: 1 });
WSUCourseSchema.index({ courseCode: 1 });
WSUCourseSchema.index({ apsRequirement: 1 });

export default WSUCourseSchema;
