import mongoose from "mongoose";

const UWCCourseSchema = new mongoose.Schema(
    {
        courseName: { type: String, required: true, trim: true },
        courseCode: { type: String, required: true, trim: true },
        majoring: { type: String, trim: true },
        duration: { type: String, trim: true },
        methodOfStudy: {
            type: String,
            enum: ["Full-time", "Part-time", "Distance", "Online", "Hybrid"],
        },
        campuses: [{ type: String, trim: true }],
        careerChoices: [{ type: String, trim: true }],

        apsRequirement: { type: Number },
        apsRequirementMathematics: { type: Number },
        apsRequirementMathLit: { type: Number },
        apsRequirementTechnicalMath: { type: Number },

        // Simple language requirements for UWC (home/additional)
        homeLanguageRequirement: {
            subjectId: { type: String }, // 'all' or specific subjectId
            percentage: { type: Number, min: 0, max: 100 },
        },
        additionalLanguageRequirement: {
            subjectId: { type: String },
            percentage: { type: Number, min: 0, max: 100 },
        },

        subjectRequirements: [
            {
                subjectId: { type: String, required: true },
                percentage: { type: Number, required: true, min: 0, max: 100 },
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

        notApplicableSubjects: [{ type: String }],
    },
    { timestamps: true, collection: "uwc" }
);

UWCCourseSchema.index({ courseName: 1 });
UWCCourseSchema.index({ courseCode: 1 });
UWCCourseSchema.index({ apsRequirement: 1 });

export default UWCCourseSchema;
