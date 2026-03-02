import { NextResponse } from "next/server";
import { isIP } from "node:net";
import { getDbConnection } from "../../../lib/db/connection";
import { DATABASES } from "../../../lib/db/databases";
import { getUserListModel } from "../../../lib/models/userList";

export const runtime = "nodejs";
const GEO_LOOKUP_RETRY_MS = 24 * 60 * 60 * 1000;

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

function extractUserIp(user) {
    const directIp = normalizeIpAddress(user?.ipAddress);
    if (directIp) return directIp;

    if (!Array.isArray(user?.visits) || user.visits.length === 0) {
        return null;
    }

    for (let i = user.visits.length - 1; i >= 0; i -= 1) {
        const visit = user.visits[i];
        const visitIp = normalizeIpAddress(
            typeof visit === "object" ? visit?.ip : null,
        );
        if (visitIp) return visitIp;
    }

    return null;
}

function shouldLookupLocation(user, lookupIp) {
    if (!lookupIp || !isPublicIpAddress(lookupIp)) return false;
    if (user?.country || user?.province) return false;

    const lastLookupAt = user?.geoLookupAt
        ? new Date(user.geoLookupAt).getTime()
        : 0;

    if (!lastLookupAt) return true;

    return Date.now() - lastLookupAt > GEO_LOOKUP_RETRY_MS;
}

async function fetchLocationFromIpapi(ipAddress) {
    ipAddress = normalizeIpAddress(ipAddress);
    if (!ipAddress || !isPublicIpAddress(ipAddress)) {
        return { province: null, country: null, countryCode: null };
    }

    try {
        // Try ipapi.co first
        const resp = await fetch(`https://ipapi.co/${ipAddress}/json/`, {
            headers: { Accept: "application/json" },
            cache: "no-store",
            signal: AbortSignal.timeout(5000),
        });
        if (resp.ok) {
            const data = await resp.json();
            return {
                province: data?.region || null,
                country: data?.country_name || null,
                countryCode: data?.country || null,
            };
        }

        // Fallback: ipwho.is
        const fallback = await fetch(`https://ipwho.is/${ipAddress}`, {
            headers: { Accept: "application/json" },
            cache: "no-store",
            signal: AbortSignal.timeout(5000),
        });
        if (fallback.ok) {
            const fbData = await fallback.json();
            return {
                province: fbData.region || fbData.region_name || null,
                country: fbData.country || fbData.country_name || null,
                countryCode: fbData.country_code || null,
            };
        }

        return { province: null, country: null, countryCode: null };
    } catch (err) {
        return { province: null, country: null, countryCode: null };
    }
}

export async function GET() {
    try {
        const conn = await getDbConnection(DATABASES.USER_LIST);
        const UserList = getUserListModel(conn);

        const users = await UserList.find({}).lean();

        // Create cache to avoid repeating lookups
        const locationCache = new Map();
        const lookupUsers = users.map((user) => {
            const lookupIp = extractUserIp(user);
            return {
                user,
                lookupIp,
                shouldLookup: shouldLookupLocation(user, lookupIp),
            };
        });

        const ipsToLookup = Array.from(
            new Set(
                lookupUsers
                    .filter((entry) => entry.shouldLookup)
                    .map((entry) => entry.lookupIp),
            ),
        );

        await Promise.all(
            ipsToLookup.map(async (ip) => {
                const location = await fetchLocationFromIpapi(ip);
                locationCache.set(ip, location);
            }),
        );

        const bulkUpdates = [];

        for (const { user, lookupIp, shouldLookup } of lookupUsers) {
            const cachedLocation = lookupIp
                ? locationCache.get(lookupIp)
                : null;
            const resolvedIp = user.ipAddress || lookupIp || null;
            const resolvedProvince =
                user.province || cachedLocation?.province || null;
            const resolvedCountry =
                user.country || cachedLocation?.country || null;
            const resolvedCountryCode =
                user.countryCode || cachedLocation?.countryCode || null;

            const setPayload = {};

            if (resolvedIp && user.ipAddress !== resolvedIp) {
                setPayload.ipAddress = resolvedIp;
            }
            if (resolvedProvince && user.province !== resolvedProvince) {
                setPayload.province = resolvedProvince;
            }
            if (resolvedCountry && user.country !== resolvedCountry) {
                setPayload.country = resolvedCountry;
            }
            if (
                resolvedCountryCode &&
                user.countryCode !== resolvedCountryCode
            ) {
                setPayload.countryCode = resolvedCountryCode;
            }
            if (shouldLookup) {
                setPayload.geoLookupAt = new Date();
            }

            if (Object.keys(setPayload).length > 0) {
                bulkUpdates.push({
                    updateOne: {
                        filter: { _id: user._id },
                        update: { $set: setPayload },
                    },
                });
            }
        }

        if (bulkUpdates.length > 0) {
            try {
                await UserList.bulkWrite(bulkUpdates, { ordered: false });
            } catch (writeErr) {
                console.error("User location persistence error:", writeErr);
            }
        }

        const withProvince = users.map((user) => {
            const lookupIp = extractUserIp(user);
            const cachedLocation = lookupIp
                ? locationCache.get(lookupIp)
                : null;

            return {
                ...user,
                ipAddress: user.ipAddress || lookupIp || null,
                province: user.province || cachedLocation?.province || null,
                country: user.country || cachedLocation?.country || null,
                countryCode:
                    user.countryCode || cachedLocation?.countryCode || null,
            };
        });

        return NextResponse.json(withProvince, { status: 200 });
    } catch (err) {
        console.error("Fetch users error:", err);
        return NextResponse.json(
            { error: "Failed to fetch users" },
            { status: 500 },
        );
    }
}
