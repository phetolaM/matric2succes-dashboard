import { NextResponse } from "next/server";
import { getDbConnection } from "../../../lib/db/connection";
import { DATABASES } from "../../../lib/db/databases";
import { getUserListModel } from "../../../lib/models/userList";

export const runtime = "nodejs";

async function fetchLocationFromIpapi(ipAddress) {
    if (!ipAddress) return { province: null, country: null, countryCode: null };

    // Normalize IP format (handle arrays, brackets, etc.)
    if (Array.isArray(ipAddress)) ipAddress = ipAddress[0];
    if (typeof ipAddress === "object") ipAddress = JSON.stringify(ipAddress);
    ipAddress = String(ipAddress)
        .replace(/\[|\]|"/g, "")
        .trim();

    try {
        // Try ipapi.co first
        const resp = await fetch(`https://ipapi.co/${ipAddress}/json/`, {
            headers: { Accept: "application/json" },
            cache: "no-store",
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
        console.error("IP lookup failed for", ipAddress, err?.message || err);
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
        const ipsToLookup = Array.from(
            new Set(
                users
                    .filter((u) => !u.province && u.ipAddress)
                    .map((u) => u.ipAddress),
            ),
        );

        await Promise.all(
            ipsToLookup.map(async (ip) => {
                const location = await fetchLocationFromIpapi(ip);
                locationCache.set(ip, location);
            }),
        );

        const withProvince = users.map((user) => ({
            ...user,
            province:
                user.province ||
                locationCache.get(user.ipAddress)?.province ||
                null,
            country:
                user.country ||
                locationCache.get(user.ipAddress)?.country ||
                null,
            countryCode:
                user.countryCode ||
                locationCache.get(user.ipAddress)?.countryCode ||
                null,
        }));

        return NextResponse.json(withProvince, { status: 200 });
    } catch (err) {
        console.error("Fetch users error:", err);
        return NextResponse.json(
            { error: "Failed to fetch users" },
            { status: 500 },
        );
    }
}
