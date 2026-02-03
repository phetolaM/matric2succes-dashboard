import { NextResponse } from "next/server";
import { getDbConnection } from "../../../lib/db/connection";
import { DATABASES } from "../../../lib/db/databases";
import { getSubjectModel } from "../../../lib/models/subject";

export async function GET() {
    try {
        const conn = await getDbConnection(DATABASES.SUBJECTS);
        const Subject = getSubjectModel(conn);

        const subjects = await Subject.find({}).lean();

        return NextResponse.json(subjects, { status: 200 });
    } catch (err) {
        console.error("Fetch subjects error:", err);
        return NextResponse.json(
            { error: "Failed to fetch subjects" },
            { status: 500 },
        );
    }
}

export async function POST(request) {
    try {
        const body = await request.json();
        const { name, isLanguage } = body || {};

        if (!name || isLanguage === null || isLanguage === undefined) {
            return NextResponse.json(
                { error: "Name and isLanguage are required" },
                { status: 400 },
            );
        }

        const conn = await getDbConnection(DATABASES.SUBJECTS);
        const Subject = getSubjectModel(conn);

        const trimmedName = name.trim();
        const escapeRegex = (value) =>
            value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const existing = await Subject.findOne({
            name: new RegExp(`^${escapeRegex(trimmedName)}$`, "i"),
        }).lean();

        if (existing) {
            return NextResponse.json(
                { error: "Subject already exists" },
                { status: 409 },
            );
        }

        const newSubject = new Subject({
            name: trimmedName,
            isLanguage: Boolean(isLanguage),
        });

        await newSubject.save();
        console.log("New subject added:", name);

        return NextResponse.json(newSubject, { status: 201 });
    } catch (err) {
        console.error("Create subject error:", err);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}
