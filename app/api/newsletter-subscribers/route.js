import { createNewsletterConnection } from "@/lib/db/newsletterConnection";
import { getNewsletterModel } from "@/lib/models/newsletter";

export async function GET(request) {
    try {
        const conn = await createNewsletterConnection();
        const NewsletterModel = getNewsletterModel(conn);

        const subscribers = await NewsletterModel.find()
            .sort({ subscribedAt: -1 })
            .lean();

        return Response.json(subscribers);
    } catch (err) {
        console.error("Failed to fetch newsletter subscribers:", err.message);
        return Response.json(
            { message: "Failed to load subscribers" },
            { status: 500 },
        );
    }
}

export async function DELETE(request) {
    try {
        const { email } = await request.json();

        if (!email) {
            return Response.json(
                { message: "Email is required" },
                { status: 400 },
            );
        }

        const conn = await createNewsletterConnection();
        const NewsletterModel = getNewsletterModel(conn);

        const result = await NewsletterModel.findOneAndDelete({ email });

        if (!result) {
            return Response.json(
                { message: "Subscriber not found" },
                { status: 404 },
            );
        }

        return Response.json({ success: true });
    } catch (err) {
        console.error("Failed to delete subscriber:", err.message);
        return Response.json(
            { message: "Failed to delete subscriber" },
            { status: 500 },
        );
    }
}
