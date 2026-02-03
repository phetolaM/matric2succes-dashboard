import { getDbConnection } from "@/lib/db/connection";
import { DATABASES } from "@/lib/db/databases";
import { ObjectId } from "mongodb";

export const dynamic = "force-dynamic";

export async function PUT(request, context) {
    const params = await context?.params;

    const raw = Array.isArray(params?.collection)
        ? params.collection[0]
        : params?.collection;
    const collectionName = raw ? String(raw).trim() : "";

    const courseIdRaw = Array.isArray(params?.courseId)
        ? params.courseId[0]
        : params?.courseId;
    const courseId = courseIdRaw ? String(courseIdRaw).trim() : "";

    if (!collectionName || !courseId) {
        return Response.json(
            { message: "Collection name and course ID are required" },
            { status: 400 },
        );
    }

    try {
        const updateData = await request.json();

        if (!updateData || typeof updateData !== "object") {
            return Response.json(
                { message: "Invalid course data" },
                { status: 400 },
            );
        }

        // Remove _id from update data if present
        const { _id, ...dataToUpdate } = updateData;

        const conn = await getDbConnection(DATABASES.UNIVERSITY_COURSES);
        const collection = conn.collection(collectionName);

        // Try update by ObjectId first; if not found and _id is a string, try string lookup
        const asObjectId = ObjectId.isValid(courseId)
            ? new ObjectId(courseId)
            : null;

        let updatedCourse = null;
        if (asObjectId) {
            updatedCourse = await collection.findOneAndUpdate(
                { _id: asObjectId },
                { $set: dataToUpdate },
                { returnDocument: "after" },
            );
        }

        if (!updatedCourse) {
            updatedCourse = await collection.findOneAndUpdate(
                { _id: courseId },
                { $set: dataToUpdate },
                { returnDocument: "after" },
            );
        }

        if (!updatedCourse) {
            return Response.json(
                { message: "Course not found" },
                { status: 404 },
            );
        }

        return Response.json(updatedCourse);
    } catch (err) {
        console.error(
            `Failed to update course in ${collectionName}:`,
            err.message,
        );
        return Response.json(
            { message: "Failed to update course" },
            { status: 500 },
        );
    }
}

export async function DELETE(request, context) {
    const params = await context?.params;

    const raw = Array.isArray(params?.collection)
        ? params.collection[0]
        : params?.collection;
    const collectionName = raw ? String(raw).trim() : "";

    const courseIdRaw = Array.isArray(params?.courseId)
        ? params.courseId[0]
        : params?.courseId;
    const courseId = courseIdRaw ? String(courseIdRaw).trim() : "";

    if (!collectionName || !courseId) {
        return Response.json(
            { message: "Collection name and course ID are required" },
            { status: 400 },
        );
    }

    try {
        const conn = await getDbConnection(DATABASES.UNIVERSITY_COURSES);
        const collection = conn.collection(collectionName);

        const result = await collection.deleteOne({
            _id: new ObjectId(courseId),
        });

        if (result.deletedCount === 0) {
            return Response.json(
                { message: "Course not found" },
                { status: 404 },
            );
        }

        return Response.json({ message: "Course deleted successfully" });
    } catch (err) {
        console.error(
            `Failed to delete course from ${collectionName}:`,
            err.message,
        );
        return Response.json(
            { message: "Failed to delete course" },
            { status: 500 },
        );
    }
}
