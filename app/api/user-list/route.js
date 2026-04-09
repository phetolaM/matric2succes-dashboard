import { NextResponse } from "next/server";
import { isIP } from "node:net";
import { getDbConnection } from "../../../lib/db/connection";
import { DATABASES } from "../../../lib/db/databases";
import { getUserListModel } from "../../../lib/models/userList";

export const runtime = "nodejs";

function normalizeIpAddress(rawIp) {
    if (!rawIp) return null;

    let ip = rawIp;
    if (Array.isArray(ip)) ip = ip[0];
    if (typeof ip === "object") ip = JSON.stringify(ip);

    ip = String(ip)
        .replace(/\[|\]|"/g, "")
        .trim();

    if (!ip) return null;

    if (ip.includes(",")) {
        ip = ip.split(",")[0].trim();
    }

    if (ip.startsWith("::ffff:")) {
        ip = ip.replace("::ffff:", "");
    }

    if (/^\d+\.\d+\.\d+\.\d+:\d+$/.test(ip)) {
        ip = ip.split(":")[0];
    }

    return ip || null;
}

function isPublicIpAddress(ipAddress) {
    const ip = normalizeIpAddress(ipAddress);
    if (!ip) return false;

    const ipVersion = isIP(ip);
    if (!ipVersion) return false;

    if (ipVersion === 4) {
        if (ip === "127.0.0.1") return false;
        if (ip.startsWith("10.")) return false;
        if (ip.startsWith("192.168.")) return false;
        if (ip.startsWith("169.254.")) return false;
        if (ip.startsWith("0.")) return false;

        if (ip.startsWith("172.")) {
            const secondOctet = Number(ip.split(".")[1]);
            if (secondOctet >= 16 && secondOctet <= 31) return false;
        }

        return true;
    }

    const lowerIp = ip.toLowerCase();
    if (lowerIp === "::1") return false;
    if (lowerIp === "::") return false;
    if (lowerIp.startsWith("fe80:")) return false;
    if (lowerIp.startsWith("fc") || lowerIp.startsWith("fd")) return false;
    if (lowerIp.startsWith("2001:db8:")) return false;

    return true;
}

function hasRealLocation(realLocation) {
    if (!realLocation || typeof realLocation !== "object") return false;
    return Boolean(
        String(realLocation.country || "").trim() ||
        String(realLocation.province || "").trim() ||
        String(realLocation.city || "").trim(),
    );
}

function getStableIp(user) {
    const directIp = normalizeIpAddress(user?.ipAddress);
    if (directIp) return directIp;

    if (!Array.isArray(user?.visits)) return null;

    for (const visit of user.visits) {
        const visitIp = normalizeIpAddress(
            typeof visit === "object" ? visit?.ip || visit?.ipAddress : null,
        );
        if (visitIp) return visitIp;
    }

    return null;
}

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWithRetry(url, maxRetries = 3, initialDelayMs = 1000) {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
            const response = await fetch(url, {
                headers: { Accept: "application/json" },
                cache: "no-store",
                signal: AbortSignal.timeout(8000),
            });

            if (response.ok) {
                return response;
            }

            if (response.status === 429 && attempt < maxRetries - 1) {
                const delayMs = initialDelayMs * Math.pow(2, attempt);
                console.log(
                    `[Geo] Rate limited (429), waiting ${delayMs}ms before retry...`,
                );
                await sleep(delayMs);
                continue;
            }

            return response;
        } catch (err) {
            if (attempt < maxRetries - 1) {
                const delayMs = initialDelayMs * Math.pow(2, attempt);
                console.log(
                    `[Geo] Request failed: ${err.message}, waiting ${delayMs}ms before retry...`,
                );
                await sleep(delayMs);
            } else {
                throw err;
            }
        }
    }
}

async function convertIpToRealLocation(ipAddress) {
    const ip = normalizeIpAddress(ipAddress);
    if (!isPublicIpAddress(ip)) {
        console.log(
            `[Geo] IP ${ipAddress} is not public, skipping geolocation`,
        );
        return null;
    }

    try {
        console.log(`[Geo] Fetching from ipapi for ${ip}...`);
        const IPAPI_KEY =
            process.env.IPAPI_KEY || "5e86896517e2ae32d47ea1965cd713f6";
        const response = await fetchWithRetry(
            `https://api.ipapi.com/api/${ip}?access_key=${IPAPI_KEY}`,
        );

        if (response.ok) {
            const data = await response.json();
            console.log(`[Geo] ipapi response for ${ip}:`, data);
            const location = {
                country: data?.country_name || null,
                province: data?.region_name || data?.region || null,
                city: data?.city || data?.town || null,
            };
            if (hasRealLocation(location)) {
                console.log(`[Geo] Valid location from ipapi:`, location);
                return location;
            } else {
                console.log(`[Geo] ipapi returned empty location for ${ip}`);
            }
        } else {
            console.log(
                `[Geo] ipapi returned status ${response.status} for ${ip}`,
            );
        }
    } catch (err) {
        console.log(`[Geo] ipapi failed for ${ip}:`, err.message);
    }

    console.log(
        `[Geo] ipapi lookup failed for ${ip}, will retry on next page load`,
    );
    return null;
}

export async function GET() {
    try {
        console.log("[User List] GET request started");
        const conn = await getDbConnection(DATABASES.USER_LIST);
        const UserList = getUserListModel(conn);

        const users = await UserList.find({}).lean();
        console.log(`[User List] Fetched ${users.length} users from DB`);

        const locationCache = new Map();
        const bulkUpdates = [];
        const hydratedUsers = [];

        for (const user of users) {
            const stableIp = getStableIp(user);
            const hasLocation = hasRealLocation(user.realLocation);
            const isStableIpPublic = isPublicIpAddress(stableIp);

            console.log(
                `[User List] User: ${user.email}, stableIp: ${stableIp}, hasLocation: ${hasLocation}, realLocation:`,
                user.realLocation,
            );

            let resolvedLocation = hasLocation ? user.realLocation : null;

            if (!hasLocation && stableIp && isStableIpPublic) {
                console.log(
                    `[User List] Attempting conversion for ${user.email}`,
                );
                let lookedUp = locationCache.get(stableIp);
                if (lookedUp === undefined) {
                    console.log(
                        `[User List] Cache miss for ${stableIp}, calling API`,
                    );
                    lookedUp = await convertIpToRealLocation(stableIp);
                    locationCache.set(stableIp, lookedUp);
                    console.log(
                        `[User List] Conversion result: ${stableIp} =>`,
                        lookedUp,
                    );
                } else {
                    console.log(
                        `[User List] Cache hit for ${stableIp}:`,
                        lookedUp,
                    );
                }

                if (lookedUp) {
                    resolvedLocation = lookedUp;
                    console.log(
                        `[User List] Adding bulk update for ${user.email} with location`,
                        lookedUp,
                    );
                    bulkUpdates.push({
                        updateOne: {
                            filter: { _id: user._id },
                            update: {
                                $set: {
                                    ...(user.ipAddress
                                        ? {}
                                        : { ipAddress: stableIp }),
                                    realLocation: lookedUp,
                                },
                            },
                        },
                    });
                } else if (!user.ipAddress) {
                    console.log(
                        `[User List] Conversion failed, saving IP for ${user.email}`,
                    );
                    bulkUpdates.push({
                        updateOne: {
                            filter: { _id: user._id },
                            update: { $set: { ipAddress: stableIp } },
                        },
                    });
                } else {
                    console.log(
                        `[User List] Conversion failed, user already has IP, no action for ${user.email}`,
                    );
                }
            } else if (!hasLocation && stableIp && !isStableIpPublic) {
                console.log(
                    `[User List] Skipping conversion for non-public IP ${stableIp} (${user.email})`,
                );

                if (!user.ipAddress) {
                    bulkUpdates.push({
                        updateOne: {
                            filter: { _id: user._id },
                            update: { $set: { ipAddress: stableIp } },
                        },
                    });
                }
            } else if (!user.ipAddress && stableIp) {
                console.log(
                    `[User List] User ${user.email} has location but missing IP, saving IP`,
                );
                bulkUpdates.push({
                    updateOne: {
                        filter: { _id: user._id },
                        update: { $set: { ipAddress: stableIp } },
                    },
                });
            }

            hydratedUsers.push({
                ...user,
                ipAddress: user.ipAddress || stableIp || null,
                ...(resolvedLocation ? { realLocation: resolvedLocation } : {}),
            });
        }

        console.log(`[User List] Prepared ${bulkUpdates.length} bulk updates`);

        if (bulkUpdates.length > 0) {
            try {
                const result = await UserList.bulkWrite(bulkUpdates, {
                    ordered: false,
                });
                console.log("[User List] BulkWrite result:", {
                    insertedCount: result.insertedCount,
                    modifiedCount: result.modifiedCount,
                    upsertedCount: result.upsertedCount,
                });
            } catch (writeErr) {
                console.error(
                    "[User List] Error in bulkWrite:",
                    writeErr.message || writeErr,
                );
            }
        }

        console.log(
            `[User List] Returning ${hydratedUsers.length} hydrated users`,
        );
        return NextResponse.json(hydratedUsers, { status: 200 });
    } catch (err) {
        console.error("[User List] Fetch users error:", err);
        return NextResponse.json(
            { error: "Failed to fetch users" },
            { status: 500 },
        );
    }
}
