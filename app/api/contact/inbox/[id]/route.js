import { createEmailInboxConnection } from "@/lib/db/emailInboxConnection";
import { getEmailModel } from "@/lib/models/emailInbox";

export async function DELETE(request, { params }) {
    try {
        const { id } = await params;

        if (!id) {
            return Response.json(
                { message: "Missing email ID" },
                { status: 400 },
            );
        }

        const conn = await createEmailInboxConnection();
        const EmailModel = getEmailModel(conn);

        const email = await EmailModel.findByIdAndDelete(id);

        if (!email) {
            return Response.json(
                { message: "Email not found" },
                { status: 404 },
            );
        }

        return Response.json({ success: true });
    } catch (err) {
        console.error("Failed to delete inbox entry:", err.message);
        return Response.json(
            { message: "Failed to delete message" },
            { status: 500 },
        );
    }
}
