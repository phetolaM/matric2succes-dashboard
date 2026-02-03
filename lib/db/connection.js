import mongoose from "mongoose";

// Cache connections across hot reloads
const globalKey = Symbol.for("multiDbConnections");
const globalStore =
    globalThis[globalKey] || (globalThis[globalKey] = { map: new Map() });

export async function getDbConnection(dbName) {
    if (!dbName) throw new Error("getDbConnection requires a dbName");
    const uri = process.env.MONGO_URI;
    if (!uri) throw new Error("Missing MONGO_URI in environment");

    if (globalStore.map.has(dbName)) {
        const conn = globalStore.map.get(dbName);
        if (conn.readyState === 1) {
            // Connected
            return conn;
        }
        // If not connected, try to open it
        try {
            await conn.openUri(uri, { dbName });
            return conn;
        } catch (err) {
            console.error(`❌ Reconnect failed for ${dbName}:`, err.message);
            throw err;
        }
    }

    // Create a new isolated connection for this DB
    const conn = mongoose.createConnection();
    try {
        await conn.openUri(uri, { dbName });
        globalStore.map.set(dbName, conn);
        console.log(`${dbName} connected`);
        return conn;
    } catch (err) {
        console.error(`❌ Connection failed for ${dbName}:`, err.message);
        throw err;
    }
}
