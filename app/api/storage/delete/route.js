import { NextResponse } from "next/server";
import { deleteFromSupabasePublicUrl } from "@/lib/services/supabase";

export const runtime = "nodejs";

export async function POST(request) {
    console.log("[API] POST /api/storage/delete - Request received");
    try {
        const { url } = await request.json();

        if (!url) {
            console.warn("[API] No URL provided for deletion");
            return NextResponse.json(
                { message: "URL is required" },
                { status: 400 },
            );
        }

        console.log("[API] Deleting file from Supabase:", url);
        const result = await deleteFromSupabasePublicUrl(url);

        console.log("[API] File deleted successfully:", result);
        return NextResponse.json({
            message: "File deleted successfully",
            result,
        });
    } catch (err) {
        console.error("[API] Delete failed:", {
            message: err.message,
            name: err.name,
            stack: err.stack,
        });
        return NextResponse.json(
            { message: "Failed to delete file", error: err.message },
            { status: 500 },
        );
    }
}
