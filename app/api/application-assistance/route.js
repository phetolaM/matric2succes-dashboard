import { NextResponse } from "next/server";
import { getDbConnection } from "@/lib/db/connection";
import { DATABASES } from "@/lib/db/databases";
import { getApplicationAssistanceModel } from "@/lib/models/applicationAssistance";

export const runtime = "nodejs";

function normalizeStudentProgress(value) {
    const normalized = String(value || "")
        .trim()
        .toLowerCase();

    if (normalized === "done") return "Done";
    if (normalized === "in progress" || normalized === "inprogress") {
        return "In Progress";
    }
    if (normalized === "pending") return "In Progress";
    return "Not Started";
}

function normalizeProgressStatus(value) {
    const normalized = String(value || "")
        .trim()
        .toLowerCase();
    if (normalized === "done") return "Done";
    if (normalized === "pending") return "Pending";
    return "Not Started";
}

function normalizeResult(value) {
    const normalized = String(value || "")
        .trim()
        .toLowerCase();
    if (normalized === "accepted") return "Accepted";
    if (normalized === "rejected") return "Rejected";
    return "";
}

function normalizeUniversityApplications(doc) {
    const selectedUniversities = Array.isArray(doc.universities)
        ? doc.universities
        : [];

    const existingApplications = Array.isArray(doc.universityApplications)
        ? doc.universityApplications
        : [];

    return selectedUniversities.map((universityName) => {
        const existing = existingApplications.find(
            (item) =>
                String(item?.universityName || "").toLowerCase() ===
                String(universityName || "").toLowerCase(),
        );

        return {
            universityName,
            appliedDate: existing?.appliedDate || null,
            universityPIN: existing?.universityPIN || "",
            studentNumber: existing?.studentNumber || "",
            universityPassword: existing?.universityPassword || "",
            progressStatus: normalizeProgressStatus(existing?.progressStatus),
            applicationResult: normalizeResult(existing?.applicationResult),
            rejectionReason: existing?.rejectionReason || "",
        };
    });
}

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const paidOnly = searchParams.get("paid") !== "false";

        const conn = await getDbConnection(DATABASES.APPLICATION_ASSISTANCE);
        const Applications = getApplicationAssistanceModel(conn);

        const query = paidOnly ? { paymentStatus: "successful" } : {};

        const applications = await Applications.find(query)
            .sort({ createdAt: -1 })
            .lean();

        const normalized = applications.map((doc) => ({
            ...doc,
            studentProgress: normalizeStudentProgress(doc.studentProgress),
            universityApplications: normalizeUniversityApplications(doc),
        }));

        return NextResponse.json(normalized, { status: 200 });
    } catch (error) {
        console.error("Failed to fetch application assistance records:", error);
        return NextResponse.json(
            { error: "Failed to fetch application assistance records" },
            { status: 500 },
        );
    }
}

export async function PUT(request) {
    try {
        const body = await request.json();
        const { id, universityApplications, studentProgress } = body || {};

        if (!id || typeof id !== "string") {
            return NextResponse.json(
                { error: "Missing record ID" },
                { status: 400 },
            );
        }

        if (!Array.isArray(universityApplications)) {
            return NextResponse.json(
                { error: "universityApplications must be an array" },
                { status: 400 },
            );
        }

        const normalizedApplications = universityApplications.map((item) => {
            const result = normalizeResult(item?.applicationResult);
            const rejectionReason =
                result === "Rejected"
                    ? String(item?.rejectionReason || "").trim()
                    : "";

            return {
                universityName: String(item?.universityName || "").trim(),
                appliedDate: item?.appliedDate || null,
                universityPIN: String(item?.universityPIN || ""),
                studentNumber: String(item?.studentNumber || ""),
                universityPassword: String(item?.universityPassword || ""),
                progressStatus: normalizeProgressStatus(item?.progressStatus),
                applicationResult: result,
                rejectionReason,
            };
        });

        const conn = await getDbConnection(DATABASES.APPLICATION_ASSISTANCE);
        const Applications = getApplicationAssistanceModel(conn);

        const updated = await Applications.findByIdAndUpdate(
            id,
            {
                $set: {
                    studentProgress: normalizeStudentProgress(studentProgress),
                    universityApplications: normalizedApplications,
                    updatedAt: new Date(),
                },
            },
            { new: true },
        ).lean();

        if (!updated) {
            return NextResponse.json(
                { error: "Record not found" },
                { status: 404 },
            );
        }

        return NextResponse.json(
            {
                ...updated,
                studentProgress: normalizeStudentProgress(
                    updated.studentProgress,
                ),
                universityApplications:
                    normalizeUniversityApplications(updated),
            },
            { status: 200 },
        );
    } catch (error) {
        console.error("Failed to update application assistance record:", error);
        return NextResponse.json(
            { error: "Failed to update application assistance record" },
            { status: 500 },
        );
    }
}
