import { NextResponse } from "next/server";
import { uploadBufferToSupabase } from "@/lib/services/supabase";

export const runtime = "nodejs";

export async function POST(request) {
    console.log("[API] POST /api/upload/image - Request received");
    try {
        console.log("[API] Parsing form data...");
        const formData = await request.formData();
        const file = formData.get("file");
        console.log(
            "[API] File from formData:",
            file ? `${file.name} (${file.size} bytes)` : "null",
        );

        if (!file || typeof file === "string") {
            console.warn("[API] No file uploaded or file is string");
            return NextResponse.json(
                { message: "No image uploaded" },
                { status: 400 },
            );
        }

        console.log("[API] Converting file to buffer...");
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        console.log("[API] Buffer created:", buffer.length, "bytes");

        const bucket = process.env.SUPABASE_IMAGES_BUCKET || "images";
        const folder =
            process.env.SUPABASE_IMAGES_PREFIX || "universities/images";
        const extension = file.name.split(".").pop();
        console.log("[API] Upload bucket/folder:", bucket, folder);

        console.log("[API] Calling uploadBufferToSupabase...");
        const result = await uploadBufferToSupabase({
            bucket,
            folder,
            buffer,
            contentType: file.type || "image/jpeg",
            extension,
        });

        console.log("[API] Upload successful:", result.publicUrl);
        return NextResponse.json({
            url: result.publicUrl,
            path: result.path,
            bucket: result.bucket,
        });
    } catch (err) {
        console.error("[API] Image upload failed:", {
            message: err.message,
            name: err.name,
            stack: err.stack,
            http_code: err.http_code,
        });
        return NextResponse.json(
            { message: "Failed to upload image", error: err.message },
            { status: 500 },
        );
    }
}
