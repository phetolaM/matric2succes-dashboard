import mongoose from "mongoose";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");

function tryLoadEnvFile(filePath) {
    if (!fs.existsSync(filePath)) return;
    const content = fs.readFileSync(filePath, "utf8");
    for (const rawLine of content.split(/\r?\n/)) {
        const line = rawLine.trim();
        if (!line || line.startsWith("#")) continue;
        const eq = line.indexOf("=");
        if (eq < 0) continue;

        const key = line.slice(0, eq).trim();
        let value = line.slice(eq + 1).trim();
        if (
            (value.startsWith('"') && value.endsWith('"')) ||
            (value.startsWith("'") && value.endsWith("'"))
        ) {
            value = value.slice(1, -1);
        }

        if (process.env[key] == null) {
            process.env[key] = value;
        }
    }
}

tryLoadEnvFile(path.join(repoRoot, ".env"));
tryLoadEnvFile(path.join(repoRoot, "server", ".env"));

const uri = process.env.MONGO_URI;
if (!uri) {
    throw new Error("MONGO_URI is missing");
}

const conn = await mongoose
    .createConnection(uri, {
        dbName: "UserList",
    })
    .asPromise();

try {
    const userCollection = conn.collection("UserListDetails");
    const counterCollection = conn.collection("UserListCounter");

    const before = await userCollection.countDocuments({});
    const deleteResult = await userCollection.deleteMany({});

    await counterCollection.updateOne(
        { key: "historicalUserCount" },
        { $set: { value: 678 } },
        { upsert: true },
    );

    const after = await userCollection.countDocuments({});
    const counter = await counterCollection.findOne({
        key: "historicalUserCount",
    });

    console.log(
        JSON.stringify(
            {
                before,
                deletedCount: deleteResult.deletedCount || 0,
                after,
                historicalTotal: counter?.value ?? null,
                nextUserNumber: (counter?.value ?? 0) + 1,
            },
            null,
            2,
        ),
    );
} finally {
    await conn.close();
    await mongoose.disconnect();
}
