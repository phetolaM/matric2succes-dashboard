import mongoose from "mongoose";

const TUTCourseSchema = new mongoose.Schema(
    {
        courseName: { type: String, required: true, trim: true },
        // courseCode: { type: String, required: true, trim: true },
        majoring: { type: String, trim: true },
        duration: { type: String, trim: true },
        methodOfStudy: {
            type: String,
            enum: ["Full-time", "Part-time", "Distance", "Online", "Hybrid"],
        },
        careerChoices: [{ type: String, trim: true }],

        apsRequirement: { type: Number },
        apsRequirementMathematics: { type: Number },
        apsRequirementMathLit: { type: Number },
        apsRequirementTechnicalMath: { type: Number },
        // Flexible APS variants: [{ aps: Number, subjectIds: [String] }]
        apsRequirementVariants: [
            {
                aps: { type: Number },
                subjectIds: [{ type: String }],
                matchAll: { type: Boolean, default: false },
            },
        ],

        // Language requirements (home/additional)
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

        // Combination requirements: admin can express "choose N of the following options (each option is a subject + level)"
        subjectCombinationRequirements: [
            {
                choose: { type: Number, required: true, min: 1 },
                options: [
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
            },
        ],
        notApplicableSubjects: [{ type: String }],
        // Free-form additional requirements (e.g. "Additional 2 Subjects, level 4 each")
        additionalRequirements: [{ type: String, trim: true }],
    },
    { timestamps: true, collection: "tut" }
);

TUTCourseSchema.index({ courseName: 1 });
TUTCourseSchema.index({ courseCode: 1 });
TUTCourseSchema.index({ apsRequirement: 1 });

export default TUTCourseSchema;
