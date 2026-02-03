import { NextResponse } from "next/server";
import { getDbConnection } from "../../../../lib/db/connection";
import { DATABASES } from "../../../../lib/db/databases";
import { getSubjectModel } from "../../../../lib/models/subject";
import mongoose from "mongoose";

export async function DELETE(request, { params }) {
    try {
        const { id } = await params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return NextResponse.json(
                { error: "Invalid subject ID" },
                { status: 400 },
            );
        }

        const conn = await getDbConnection(DATABASES.SUBJECTS);
        const Subject = getSubjectModel(conn);

        const deleted = await Subject.findByIdAndDelete(id);

        if (!deleted) {
            return NextResponse.json(
                { error: "Subject not found" },
                { status: 404 },
            );
        }

        console.log("Subject deleted:", deleted.name);
        return NextResponse.json({ success: true }, { status: 200 });
    } catch (err) {
        console.error("Delete subject error:", err);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}
