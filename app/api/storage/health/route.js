import { NextResponse } from "next/server";
import supabase, { supabaseHealthCheck } from "@/lib/services/supabase";

export const runtime = "nodejs";

export async function GET() {
    try {
        const basic = supabaseHealthCheck();
        if (!basic.ok) {
            return NextResponse.json(
                { ok: false, message: basic.message },
                { status: 500 },
            );
        }

        // Simple list to verify auth and bucket access (does not require specific bucket)
        const { data, error } = await supabase.storage.listBuckets();
        if (error) {
            return NextResponse.json(
                { ok: false, message: error.message },
                { status: 500 },
            );
        }

        return NextResponse.json({
            ok: true,
            buckets: data?.map((b) => b.name) || [],
        });
    } catch (err) {
        console.error("[Storage Health] Error:", err);
        return NextResponse.json(
            { ok: false, message: err.message },
            { status: 500 },
        );
    }
}
