import mongoose from "mongoose";

// SMU schema trimmed to only include the allowed inputs for SMU admin forms.
const SMUCourseSchema = new mongoose.Schema(
    {
        courseName: { type: String, required: true, trim: true },
        duration: { type: String, trim: true },
        methodOfStudy: {
            type: String,
            enum: ["Full-time", "Part-time", "Distance", "Online", "Hybrid"],
        },
        careerChoices: [{ type: String, trim: true }],

        // Only keep the main APS requirement (no per-math variants)
        apsRequirement: { type: Number },

        // Subject requirements (AND)
        subjectRequirements: [
            {
                subjectId: { type: String, required: true },
                percentage: { type: Number, required: true, min: 0, max: 100 },
            },
        ],

        // Subject requirement groups (OR groups)
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

        // Additional requirements: choose N remaining subjects at a minimum APS level
        additionalRequirements: [
            {
                count: { type: Number, min: 1, max: 5 },
                level: { type: Number, min: 1, max: 7 },
            },
        ],
        // Language requirements (optional). `subjectId` may be a specific
        // subject `_id` from the subjects collection or the string "all"
        // to indicate any language. `percentage` is the minimum percent
        // required for the selected language.
        homeLanguageRequirement: {
            subjectId: { type: String },
            percentage: { type: Number, min: 0, max: 100 },
        },
        additionalLanguageRequirement: {
            subjectId: { type: String },
            percentage: { type: Number, min: 0, max: 100 },
        },
    },
    { timestamps: true, collection: "smu" }
);

SMUCourseSchema.index({ courseName: 1 });
SMUCourseSchema.index({ apsRequirement: 1 });

export default SMUCourseSchema;
