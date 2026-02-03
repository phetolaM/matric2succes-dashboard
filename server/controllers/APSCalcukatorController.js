import mongoose from "mongoose";
import { universities } from "../apsLogic/Index.js";
import { calculateAllUniversitiesAPS } from "../apsLogic/mainAPSLogic.js";
import Subject from "../models/SubjectModel.js";
import { universityCoursesDbConnection } from "../config/coursesDB/coursesDb.js";
import {
    getUniversitySchema,
    hasUniversitySchema,
} from "../models/courseSchemas/index.js";
import { apsVisibilityDbConnection } from "../config/apsVisibility/apsVisibilityDb.js";
import { getApsVisibilityModel } from "../models/apsVisibilityModel.js";

const modelCache = new Map();

async function getEnabledUniversityCodes() {
    try {
        const Model = getApsVisibilityModel(apsVisibilityDbConnection);
        const docs = await Model.find({}).lean();
        if (!docs.length) return null; // no overrides stored yet
        return docs.filter((d) => d.enabled !== false).map((d) => d.code);
    } catch (err) {
        console.error("Failed to read APS visibility overrides:", err);
        return null;
    }
}

function getUniversityModel(code) {
    if (modelCache.has(code)) return modelCache.get(code);

    const meta = universities[code]?.meta;
    if (!meta) return null;

    let schema;

    // Try to get university-specific schema
    if (hasUniversitySchema(code)) {
        schema = getUniversitySchema(code);
        console.log(`✅ Using custom schema for ${code.toUpperCase()}`);
    } else {
        // Fallback to generic schema for universities without custom schemas
        console.log(
            `⚠️  No custom schema for ${code.toUpperCase()}, using generic schema`,
        );
        schema = new mongoose.Schema(
            {
                courseName: String,
                courseCode: String,
                majoring: String,
                apsRequirement: Number,
                apsRequirementMathematics: Number,
                apsRequirementMathLit: Number,
                apsRequirementTechnicalMath: Number,
                duration: String,
                methodOfStudy: String,
                campuses: [String],
                careerChoices: [String],
                homeLanguageRequirement: {
                    subjectId: String,
                    percentage: Number,
                },
                additionalLanguageRequirement: {
                    subjectId: String,
                    percentage: Number,
                },
                subjectRequirements: [
                    {
                        subjectId: String,
                        percentage: Number,
                    },
                ],
                subjectRequirementGroups: [
                    [
                        {
                            subjectId: String,
                            percentage: Number,
                        },
                    ],
                ],
            },
            { collection: meta.collections[0], strict: false },
        );
    }

    const model = universityCoursesDbConnection.model(
        meta.collections[0],
        schema,
    );
    modelCache.set(code, model);
    return model;
}

export async function calculateEligibility(req, res) {
    try {
        const { subjects } = req.body;

        // Calculate APS scores
        let apsResults = calculateAllUniversitiesAPS(subjects);

        // Apply visibility overrides if any are stored
        const enabledCodes = await getEnabledUniversityCodes();
        if (Array.isArray(enabledCodes)) {
            const allow = new Set(enabledCodes.map((c) => c.toLowerCase()));
            apsResults = apsResults.filter((r) => allow.has(r.university));
        }
        console.log(
            `🎓 Processing ${apsResults.length} universities:`,
            apsResults.map((r) => r.university).join(", "),
        );

        // Prepare subject mappings
        const subjectDocs = await Subject.find({});
        const idToName = new Map(
            subjectDocs.map((doc) => [
                doc._id.toString(),
                doc.name.toLowerCase(),
            ]),
        );

        // Create user subject map
        const userSubjectsMap = new Map();
        [
            subjects.homeLanguage,
            subjects.additionalLanguage,
            subjects.mathSubject,
            ...(subjects.otherSubjects || []),
            subjects.lifeOrientation,
        ].forEach((subj) => {
            if (subj?.subject) {
                userSubjectsMap.set(
                    subj.subject.toLowerCase().trim(),
                    Number(subj.percent || 0),
                );
            }
        });

        // Add explicit keys for language logic
        if (subjects.homeLanguage?.subject) {
            userSubjectsMap.set(
                "home language",
                Number(subjects.homeLanguage.percent || 0),
            );
            userSubjectsMap.set(
                "home language subject",
                subjects.homeLanguage.subject.toLowerCase().trim(),
            );
        }
        if (subjects.additionalLanguage?.subject) {
            userSubjectsMap.set(
                "additional language",
                Number(subjects.additionalLanguage.percent || 0),
            );
            userSubjectsMap.set(
                "additional language subject",
                subjects.additionalLanguage.subject.toLowerCase().trim(),
            );
        }

        // Process universities
        const results = await Promise.all(
            apsResults.map(async ({ university: code, aps }) => {
                try {
                    const uni = universities[code];
                    if (!uni) {
                        console.log(
                            `⚠️  No university found for code: ${code}`,
                        );
                        return null;
                    }

                    const Model = getUniversityModel(code);
                    const courses = Model ? await Model.find().lean() : [];
                    console.log(
                        `📊 ${code.toUpperCase()}: Found ${
                            courses.length
                        } courses in database`,
                    );

                    const qualifiedCourses =
                        code === "cput"
                            ? uni.getQualifiedCourses({
                                  userSubjects: [
                                      subjects.homeLanguage,
                                      subjects.additionalLanguage,
                                      subjects.mathSubject,
                                      ...(subjects.otherSubjects || []),
                                      subjects.lifeOrientation,
                                  ].filter(Boolean),
                                  courses,
                                  idToName,
                              })
                            : uni.getQualifiedCourses({
                                  aps,
                                  userSubjectsMap,
                                  courses,
                                  idToName,
                                  mathSubjects: uni.meta.mathSubjects,
                              }) || [];

                    const result = {
                        university: code,
                        displayName: uni.meta.displayName,
                        aps: code === "cput" ? null : aps, // <-- For CPUT, no base APS
                        qualifiedCourses: qualifiedCourses,
                        totalCourses: qualifiedCourses.length,
                    };
                    console.log(
                        `✅ ${code.toUpperCase()}: Returning ${
                            qualifiedCourses.length
                        } qualified courses`,
                    );
                    return result;
                } catch (error) {
                    console.error(`❌ University ${code} error:`, error);
                    return null;
                }
            }),
        );

        res.json({
            success: true,
            results: results.filter(Boolean),
        });
    } catch (error) {
        console.error("Calculation error:", error);
        res.status(500).json({
            success: false,
            error: "Internal server error",
            details:
                process.env.NODE_ENV === "development"
                    ? error.message
                    : undefined,
        });
    }
}
