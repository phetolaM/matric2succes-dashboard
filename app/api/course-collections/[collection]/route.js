import { getDbConnection } from "@/lib/db/connection";
import { DATABASES } from "@/lib/db/databases";
import { ObjectId } from "mongodb";

export const dynamic = "force-dynamic";

export async function GET(request, context) {
    // Next.js hands params as a Promise in dynamic API routes; unwrap it first
    const params = await context?.params;

    const raw = Array.isArray(params?.collection)
        ? params.collection[0]
        : params?.collection;
    const collectionName = raw ? String(raw).trim() : "";

    if (!collectionName) {
        return Response.json(
            { message: "Collection name is required" },
            { status: 400 },
        );
    }

    try {
        const url = new URL(request.url);
        const courseId = url.searchParams.get("courseId");

        const conn = await getDbConnection(DATABASES.UNIVERSITY_COURSES);
        const collection = conn.collection(collectionName);

        // If courseId is provided, fetch single course
        if (courseId) {
            let course = null;
            if (ObjectId.isValid(courseId)) {
                course = await collection.findOne({
                    _id: new ObjectId(courseId),
                });
            }

            // Fallback: handle string _id documents
            if (!course) {
                course = await collection.findOne({ _id: courseId });
            }

            if (!course) {
                return Response.json(
                    { message: "Course not found" },
                    { status: 404 },
                );
            }
            return Response.json(course);
        }

        // Otherwise fetch all courses, newest first
        const courses = await collection.find({}).sort({ _id: -1 }).toArray();
        return Response.json(courses);
    } catch (err) {
        console.error(
            `Failed to fetch courses for ${collectionName}:`,
            err.message,
        );
        return Response.json(
            { message: "Failed to fetch courses" },
            { status: 500 },
        );
    }
}

export async function POST(request, context) {
    const params = await context?.params;

    const raw = Array.isArray(params?.collection)
        ? params.collection[0]
        : params?.collection;
    const collectionName = raw ? String(raw).trim() : "";

    if (!collectionName) {
        return Response.json(
            { message: "Collection name is required" },
            { status: 400 },
        );
    }

    try {
        const courseData = await request.json();

        if (!courseData || typeof courseData !== "object") {
            return Response.json(
                { message: "Invalid course data" },
                { status: 400 },
            );
        }

        const conn = await getDbConnection(DATABASES.UNIVERSITY_COURSES);
        const collection = conn.collection(collectionName);

        const result = await collection.insertOne(courseData);

        return Response.json(
            {
                _id: result.insertedId,
                ...courseData,
            },
            { status: 201 },
        );
    } catch (err) {
        console.error(
            `Failed to create course for ${collectionName}:`,
            err.message,
        );
        return Response.json(
            { message: "Failed to create course" },
            { status: 500 },
        );
    }
}
