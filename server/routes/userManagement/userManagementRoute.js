// routes/newsletterRoutes.js
import express from "express";
import NewsletterSubscriber from "../../models/subscribeNewsLetter.js";
import { verifyAdmin } from "../../middleware/verifyAdmin.js";

const router = express.Router();

router.get("/", verifyAdmin, async (req, res) => {
    try {
        // Return email and subscribedAt so clients can display accurate join dates
        const subscribers = await NewsletterSubscriber.find(
            {},
            "email subscribedAt"
        );
        // Send the array of subscriber objects: { _id, email, subscribedAt }
        res.status(200).json(subscribers);
    } catch (err) {
        console.error("Error fetching subscribers:", err);
        res.status(500).json({ message: "Internal server error" });
    }
});

// Example Express.js route
router.delete("/", verifyAdmin, async (req, res) => {
    try {
        const { email } = req.body;

        // With this:
        await NewsletterSubscriber.deleteOne({ email });

        res.status(200).json({ message: "Subscriber removed successfully" });
    } catch (error) {
        console.error("Error deleting subscriber:", error);
        res.status(500).json({ error: "Failed to delete subscriber" });
    }
});

export default router;
