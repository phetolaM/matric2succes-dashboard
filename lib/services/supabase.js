import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "crypto";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error(
        "[Supabase] Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Uploads will fail until set.",
    );
}

const supabase =
    supabaseUrl && supabaseServiceKey
        ? createClient(supabaseUrl, supabaseServiceKey)
        : null;

export function supabaseHealthCheck() {
    if (!supabase) {
        return {
            ok: false,
            message: "Supabase client not configured (missing env).",
        };
    }
    return { ok: true };
}

export async function uploadBufferToSupabase({
    bucket,
    folder,
    buffer,
    contentType,
    extension,
}) {
    if (!supabase) throw new Error("Supabase client not configured");
    if (!bucket) throw new Error("bucket is required");

    const safeFolder = folder ? folder.replace(/^\/+|\/+$/g, "") : "";
    const fileName = `${Date.now()}-${randomUUID()}${extension ? `.${extension}` : ""}`;
    const path = safeFolder ? `${safeFolder}/${fileName}` : fileName;

    const { error } = await supabase.storage.from(bucket).upload(path, buffer, {
        contentType: contentType || "application/octet-stream",
        upsert: true,
    });

    if (error) {
        console.error("[Supabase] Upload error:", error);
        throw error;
    }

    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return {
        publicUrl: data?.publicUrl,
        path,
        bucket,
    };
}

export async function deleteFromSupabasePublicUrl(publicUrl) {
    if (!supabase) throw new Error("Supabase client not configured");
    if (!publicUrl) return { skipped: true };

    const parsed = extractBucketAndPathFromPublicUrl(publicUrl);
    if (!parsed) return { skipped: true };

    const { bucket, path } = parsed;
    const { error } = await supabase.storage.from(bucket).remove([path]);
    if (error) {
        console.error("[Supabase] Delete error:", error);
        throw error;
    }
    return { bucket, path };
}

export function extractBucketAndPathFromPublicUrl(publicUrl) {
    try {
        if (!supabaseUrl || !publicUrl) return null;
        const prefix = `${supabaseUrl}/storage/v1/object/public/`;
        if (!publicUrl.startsWith(prefix)) return null;
        const remainder = publicUrl.slice(prefix.length); // bucket/path/to/file
        const [bucket, ...rest] = remainder.split("/");
        const path = rest.join("/");
        if (!bucket || !path) return null;
        return { bucket, path };
    } catch (err) {
        console.error("[Supabase] Failed to extract bucket/path:", err);
        return null;
    }
}

export default supabase;
