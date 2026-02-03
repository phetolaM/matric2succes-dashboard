import { createEmailInboxConnection } from "@/lib/db/emailInboxConnection";
import { getEmailModel } from "@/lib/models/emailInbox";

export async function GET(request) {
    try {
        const conn = await createEmailInboxConnection();
        const EmailModel = getEmailModel(conn);

        const emails = await EmailModel.find().sort({ receivedAt: -1 }).lean();

        return Response.json(emails);
    } catch (err) {
        console.error("Failed to fetch inbox:", err.message);
        return Response.json(
            { message: "Failed to load inbox" },
            { status: 500 },
        );
    }
}
