#!/usr/bin/env node
/**
 * Setup Supabase Storage Buckets and Policies
 * Run: node scripts/setup-supabase-buckets.mjs
 */

import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error("❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const buckets = [
    { name: "university-images", public: true },
    { name: "university-pdfs", public: true },
];

async function setupBuckets() {
    try {
        console.log("🔧 Setting up Supabase Storage buckets...\n");

        for (const bucket of buckets) {
            try {
                console.log(`📦 Creating bucket: ${bucket.name}...`);
                const { data, error } = await supabase.storage.createBucket(
                    bucket.name,
                    { public: bucket.public },
                );

                if (error) {
                    if (error.message.includes("already exists")) {
                        console.log(
                            `   ℹ️  Bucket "${bucket.name}" already exists`,
                        );
                    } else {
                        throw error;
                    }
                } else {
                    console.log(
                        `   ✅ Bucket "${bucket.name}" created successfully`,
                    );
                }
            } catch (err) {
                console.error(
                    `   ❌ Error with bucket "${bucket.name}":`,
                    err.message,
                );
            }
        }

        console.log("\n✅ Supabase storage setup complete!");
        console.log("\nNext steps:");
        console.log(
            "1. Verify buckets exist in Supabase dashboard (Storage tab)",
        );
        console.log(
            "2. Test uploads via /api/upload/image and /api/upload/pdf",
        );
        console.log("3. Check that files are accessible via their public URLs");
    } catch (err) {
        console.error("❌ Setup failed:", err.message);
        process.exit(1);
    }
}

setupBuckets();
