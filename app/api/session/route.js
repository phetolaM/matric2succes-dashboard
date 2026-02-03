import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySession } from "../../../lib/auth/session";

export async function GET() {
    const cookieStore = cookies();
    const token = cookieStore.get("session")?.value;

    if (!token) {
        return NextResponse.json({ authenticated: false }, { status: 200 });
    }

    const { valid, payload } = verifySession(token);
    if (!valid) {
        return NextResponse.json({ authenticated: false }, { status: 200 });
    }

    return NextResponse.json(
        {
            authenticated: true,
            user: { email: payload.email, role: payload.role },
        },
        { status: 200 },
    );
}
