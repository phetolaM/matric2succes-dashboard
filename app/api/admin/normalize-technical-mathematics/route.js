import { NextResponse } from "next/server";
import { getDbConnection } from "@/lib/db/connection";
import { DATABASES } from "@/lib/db/databases";
import { getSubjectModel } from "@/lib/models/subject";

export const dynamic = "force-dynamic";

const TARGET_NAME = "Technical Mathematics";
const TARGET_REGEX = /^technical mathematics$/i;

export async function POST() {
    try {
        const subjectsConn = await getDbConnection(DATABASES.SUBJECTS);
        const Subject = getSubjectModel(subjectsConn);

        const matches = await Subject.find({ name: TARGET_REGEX }).lean();

        if (!matches || matches.length <= 1) {
            return NextResponse.json(
                {
                    message: "No duplicates found for Technical Mathematics.",
                    found: matches?.length || 0,
                },
                { status: 200 },
            );
        }

        const preferred =
            matches.find((s) => s.name === TARGET_NAME) || matches[0];
        const canonicalId = String(preferred._id);
        const duplicateIds = matches
            .filter((s) => String(s._id) !== canonicalId)
            .map((s) => String(s._id));

        // Ensure canonical has consistent name
        await Subject.updateOne(
            { _id: preferred._id },
            { $set: { name: TARGET_NAME } },
        );

        // Update all course collections to use the canonical subjectId
        const coursesConn = await getDbConnection(DATABASES.UNIVERSITY_COURSES);
        const collections = await coursesConn.db
            .listCollections()
            .toArray();

        const pipeline = [
            {
                $set: {
                    subjectRequirements: {
                        $map: {
                            input: { $ifNull: ["$subjectRequirements", []] },
                            as: "req",
                            in: {
                                $mergeObjects: [
                                    "$$req",
                                    {
                                        subjectId: {
                                            $cond: [
                                                {
                                                    $in: [
                                                        "$$req.subjectId",
                                                        duplicateIds,
                                                    ],
                                                },
                                                canonicalId,
                                                "$$req.subjectId",
                                            ],
                                        },
                                    },
                                ],
                            },
                        },
                    },
                    subjectRequirementGroups: {
                        $map: {
                            input: {
                                $ifNull: ["$subjectRequirementGroups", []],
                            },
                            as: "group",
                            in: {
                                $map: {
                                    input: { $ifNull: ["$$group", []] },
                                    as: "item",
                                    in: {
                                        $mergeObjects: [
                                            "$$item",
                                            {
                                                subjectId: {
                                                    $cond: [
                                                        {
                                                            $in: [
                                                                "$$item.subjectId",
                                                                duplicateIds,
                                                            ],
                                                        },
                                                        canonicalId,
                                                        "$$item.subjectId",
                                                    ],
                                                },
                                            },
                                        ],
                                    },
                                },
                            },
                        },
                    },
                    languageRequirements: {
                        $map: {
                            input: { $ifNull: ["$languageRequirements", []] },
                            as: "req",
                            in: {
                                $mergeObjects: [
                                    "$$req",
                                    {
                                        subjectId: {
                                            $cond: [
                                                {
                                                    $in: [
                                                        "$$req.subjectId",
                                                        duplicateIds,
                                                    ],
                                                },
                                                canonicalId,
                                                "$$req.subjectId",
                                            ],
                                        },
                                    },
                                ],
                            },
                        },
                    },
                    notApplicableSubjects: {
                        $cond: [
                            { $isArray: "$notApplicableSubjects" },
                            {
                                $map: {
                                    input: "$notApplicableSubjects",
                                    as: "id",
                                    in: {
                                        $cond: [
                                            { $in: ["$$id", duplicateIds] },
                                            canonicalId,
                                            "$$id",
                                        ],
                                    },
                                },
                            },
                            "$notApplicableSubjects",
                        ],
                    },
                },
            },
        ];

        let totalModified = 0;
        for (const col of collections) {
            const collection = coursesConn.db.collection(col.name);
            const result = await collection.updateMany({}, pipeline);
            totalModified += result.modifiedCount || 0;
        }

        // Remove duplicate subjects
        await Subject.deleteMany({ _id: { $in: duplicateIds } });

        return NextResponse.json(
            {
                message: "Technical Mathematics duplicates normalized.",
                canonicalId,
                removedCount: duplicateIds.length,
                courseDocumentsUpdated: totalModified,
            },
            { status: 200 },
        );
    } catch (err) {
        console.error("Normalize Technical Mathematics error:", err);
        return NextResponse.json(
            { error: "Failed to normalize Technical Mathematics" },
            { status: 500 },
        );
    }
}
