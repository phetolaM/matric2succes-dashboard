import { getDbConnection } from "@/lib/db/connection";
import { DATABASES } from "@/lib/db/databases";

export const dynamic = "force-dynamic";

const DISPLAY_NAME_MAP = {
    uj: "University of Johannesburg",
    up: "University of Pretoria",
    uwc: "University of the Western Cape",
    wsu: "Walter Sisulu University",
    uct: "University of Cape Town",
    ufh: "University of Fort Hare",
    ufs: "University of the Free State",
    ukzn: "University of KwaZulu-Natal",
    ul: "University of Limpopo",
    nwu: "North-West University",
    ru: "Rhodes University",
    smu: "Sefako Makgatho Health Sciences University",
    su: "Stellenbosch University",
    wits: "University of the Witwatersrand",
    cput: "Cape Peninsula University of Technology",
    cut: "Central University of Technology",
    dut: "Durban University of Technology",
    mut: "Mangosuthu University of Technology",
    tut: "Tshwane University of Technology",
    vut: "Vaal University of Technology",
    nmu: "Nelson Mandela University",
    unisa: "University of South Africa",
    univen: "University of Venda",
    unizulu: "University of Zululand",
    spu: "Sol Plaatje University",
    ump: "University of Mpumalanga",
};

const COLLECTION_NAME = "visibility";

async function getCollectionCodes(coursesConn) {
    const collections = await coursesConn.db.listCollections().toArray();
    return collections
        .map((c) => c?.name)
        .filter(Boolean)
        .filter((name) => !name.startsWith("system."))
        .sort((a, b) => a.localeCompare(b));
}

async function fetchVisibilityState() {
    const coursesConn = await getDbConnection(DATABASES.UNIVERSITY_COURSES);
    const visibilityConn = await getDbConnection(DATABASES.APS_VISIBILITY);
    const visibilityCol = visibilityConn.collection(COLLECTION_NAME);

    const [codes, stored] = await Promise.all([
        getCollectionCodes(coursesConn),
        visibilityCol.find({}).toArray(),
    ]);

    console.log("Stored docs from DB:", JSON.stringify(stored.slice(0, 3), null, 2));

    const storedMap = new Map(
        stored.map((doc) => [
            doc.code,
            { 
                enabled: doc.enabled, 
                displayName: doc.displayName 
            },
        ]),
    );

    // Seed any missing codes so the DB/collection is created and complete
    const missing = codes.filter((code) => !storedMap.has(code));
    if (missing.length) {
        const ops = missing.map((code) => ({
            updateOne: {
                filter: { code },
                update: {
                    $set: {
                        code,
                        enabled: true,
                        displayName:
                            DISPLAY_NAME_MAP[code] || code.toUpperCase(),
                        updatedAt: new Date(),
                    },
                },
                upsert: true,
            },
        }));
        await visibilityCol.bulkWrite(ops);
    }

    return codes.map((code) => {
        const storedEntry = storedMap.get(code);
        const displayName =
            storedEntry?.displayName ||
            DISPLAY_NAME_MAP[code] ||
            code.toUpperCase();
        // If stored entry exists, use its enabled value; otherwise default to true
        const enabled = storedEntry !== undefined ? (storedEntry.enabled !== false) : true;
        return { code, displayName, enabled };
    });
}

export async function GET() {
    try {
        const state = await fetchVisibilityState();
        return Response.json(state);
    } catch (err) {
        console.error("Failed to fetch APS visibility state:", err.message);
        return Response.json(
            { message: "Failed to fetch APS visibility" },
            { status: 500 },
        );
    }
}

export async function PUT(request) {
    try {
        const body = await request.json();
        const updates = Array.isArray(body?.updates) ? body.updates : [];

        if (updates.length === 0) {
            return Response.json(
                { message: "No updates provided" },
                { status: 400 },
            );
        }

        const visibilityConn = await getDbConnection(DATABASES.APS_VISIBILITY);
        const visibilityCol = visibilityConn.collection(COLLECTION_NAME);

        const ops = updates
            .filter((u) => u?.code)
            .map((u) => ({
                code: String(u.code).trim(),
                enabled: Boolean(u.enabled),
                displayName:
                    u.displayName ||
                    DISPLAY_NAME_MAP[u.code] ||
                    String(u.code).toUpperCase(),
            }));

        console.log("Saving visibility updates:", JSON.stringify(ops, null, 2));

        const writeResults = await Promise.all(
            ops.map(async (op) => {
                const result = await visibilityCol.updateOne(
                    { code: op.code },
                    {
                        $set: {
                            code: op.code,
                            enabled: op.enabled,
                            displayName: op.displayName,
                            updatedAt: new Date(),
                        },
                    },
                    { upsert: true },
                );
                return { code: op.code, matched: result.matchedCount, modified: result.modifiedCount, upserted: result.upsertedCount };
            }),
        );
        
        console.log("Write results:", JSON.stringify(writeResults.slice(0, 3), null, 2));

        const state = await fetchVisibilityState();
        return Response.json(state);
    } catch (err) {
        console.error("Failed to update APS visibility:", err.message);
        return Response.json(
            { message: "Failed to update APS visibility" },
            { status: 500 },
        );
    }
}
