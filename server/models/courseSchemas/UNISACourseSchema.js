import mongoose from "mongoose";

// UNISA (University of South Africa) Course Schema
const UNISACourseSchema = new mongoose.Schema(
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

        // Language Requirements
        languageRequirements: [
            {
                subjectId: {
                    type: String,
                    required: true,
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
        // UNISA-specific rule: require four additional content subjects >= 60%
        fourContentAtLeast60: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
        collection: "unisa",
    }
);

UNISACourseSchema.index({ courseName: 1 });
UNISACourseSchema.index({ courseCode: 1 });

export default UNISACourseSchema;
