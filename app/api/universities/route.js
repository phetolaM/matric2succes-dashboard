import { createUniversityConnection } from "@/lib/db/universityConnection";
import { getUniversityModel } from "@/lib/models/university";
import { deleteFromSupabasePublicUrl } from "@/lib/services/supabase";

// GET all universities or specific university by ID
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get("id");

        const conn = await createUniversityConnection();
        const UniversityModel = getUniversityModel(conn);

        if (id) {
            // Get single university by ID
            const university = await UniversityModel.findById(id);
            if (!university) {
                return Response.json(
                    { message: "University not found" },
                    { status: 404 },
                );
            }
            return Response.json(university);
        } else {
            // Get all universities
            const universities = await UniversityModel.find().lean();
            return Response.json(universities);
        }
    } catch (err) {
        console.error("Failed to fetch universities:", err.message);
        return Response.json(
            { message: "Failed to load universities" },
            { status: 500 },
        );
    }
}

// POST - Create new university
export async function POST(request) {
    try {
        const body = await request.json();

        // Validate required fields
        if (!body.title || !body.subtitle) {
            return Response.json(
                { message: "Title and subtitle are required" },
                { status: 400 },
            );
        }

        const conn = await createUniversityConnection();
        const UniversityModel = getUniversityModel(conn);

        const university = new UniversityModel(body);
        await university.save();

        return Response.json(university, { status: 201 });
    } catch (err) {
        console.error("Failed to create university:", err.message);
        return Response.json(
            { message: "Failed to create university" },
            { status: 500 },
        );
    }
}

// PUT - Update university
export async function PUT(request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get("id");

        if (!id) {
            return Response.json(
                { message: "University ID is required" },
                { status: 400 },
            );
        }

        const body = await request.json();

        const conn = await createUniversityConnection();
        const UniversityModel = getUniversityModel(conn);

        const university = await UniversityModel.findByIdAndUpdate(id, body, {
            new: true,
            runValidators: true,
        });

        if (!university) {
            return Response.json(
                { message: "University not found" },
                { status: 404 },
            );
        }

        return Response.json(university);
    } catch (err) {
        console.error("Failed to update university:", err.message);
        return Response.json(
            { message: "Failed to update university" },
            { status: 500 },
        );
    }
}

// DELETE - Remove university
export async function DELETE(request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get("id");

        if (!id) {
            return Response.json(
                { message: "University ID is required" },
                { status: 400 },
            );
        }

        const conn = await createUniversityConnection();
        const UniversityModel = getUniversityModel(conn);

        const university = await UniversityModel.findByIdAndDelete(id);

        if (!university) {
            return Response.json(
                { message: "University not found" },
                { status: 404 },
            );
        }

        // Delete associated files from Supabase Storage
        const filesToDelete = [];

        if (university.image) {
            filesToDelete.push(deleteFromSupabasePublicUrl(university.image));
        }

        if (university.prospectus?.link) {
            filesToDelete.push(
                deleteFromSupabasePublicUrl(university.prospectus.link),
            );
        }

        if (filesToDelete.length > 0) {
            Promise.all(filesToDelete).catch((err) => {
                console.error("[API] Error deleting files from Supabase:", err);
            });
        }

        return Response.json({ success: true, message: "University deleted" });
    } catch (err) {
        console.error("Failed to delete university:", err.message);
        return Response.json(
            { message: "Failed to delete university" },
            { status: 500 },
        );
    }
}
