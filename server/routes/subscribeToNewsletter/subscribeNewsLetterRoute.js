// routes/newsletterRoutes.js
import express from "express";
import NewsletterSubscriber from "../../models/subscribeNewsLetter.js";

const router = express.Router();

// POST / -> subscribe a new email
router.post("/", async (req, res) => {
    // console.log("[newsletterRoutes] Incoming request", {
    //     method: req.method,
    //     url: req.originalUrl,
    // });
    // console.log("[newsletterRoutes] Request body:", req.body);

    const { email } = req.body || {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!email) {
        // console.log("[newsletterRoutes] Validation failed: email is missing");
        return res.status(400).json({ message: "Email is required" });
    }

    if (!emailRegex.test(email)) {
        // console.log(
        //     "[newsletterRoutes] Validation failed: invalid email format:",
        //     email
        // );
        return res.status(400).json({ message: "Invalid email format" });
    }

    try {
        // console.log(
        //     "[newsletterRoutes] Checking for existing subscriber for:",
        //     email
        // );
        const existingSubscriber = await NewsletterSubscriber.findOne({
            email,
        });
        if (existingSubscriber) {
            // console.log("[newsletterRoutes] Email already subscribed:", email);
            return res
                .status(400)
                .json({ message: "Email already subscribed" });
        }

        // console.log("[newsletterRoutes] Creating new subscriber for:", email);
        const newSubscriber = new NewsletterSubscriber({ email });
        const saved = await newSubscriber.save();
        // console.log("[newsletterRoutes] Subscriber saved:", saved);
        res.status(201).json({ message: "Subscription successful" });
    } catch (error) {
        // console.error("[newsletterRoutes] Subscription error:", error);
        if (error.code === 11000) {
            // console.log(
            //     "[newsletterRoutes] Duplicate key error for email:",
            //     email
            // );
            return res
                .status(400)
                .json({ message: "Email already subscribed" });
        }
        res.status(500).json({ message: "Server error" });
    }
});

export default router;
