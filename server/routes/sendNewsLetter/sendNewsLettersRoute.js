// import express from "express";
// import nodemailer from "nodemailer";
// import NewsletterSubscriber from "../models/subscribeNewsLetter.js";

// const router = express.Router();

// router.post("/", async (req, res) => {
//     const { subject, textContent } = req.body;

//     console.log("📥 Received newsletter request:", subject);

//     if (!subject || !textContent) {
//         console.warn("⚠️ Missing subject or HTML content");
//         return res
//             .status(400)
//             .json({ error: "Subject and message are required" });
//     }

//     try {
//         // Get all subscriber emails
//         const subscribers = await NewsletterSubscriber.find({}, "email");
//         const emailList = subscribers.map((sub) => sub.email);

//         console.log(`👥 Found ${emailList.length} subscriber(s)`);

//         if (emailList.length === 0) {
//             return res.status(400).json({ error: "No subscribers found." });
//         }

//         // Create transporter
//         const transporter = nodemailer.createTransport({
//             service: "gmail",
//             auth: {
//                 user: process.env.MY_EMAIL,
//                 pass: process.env.MY_EMAIL_PASSWORD,
//             },
//         });

//         // Email options
//         const mailOptions = {
//             from: `<${process.env.EMAIL_USER}>`,
//             // to: emailList,
//              bcc: emailList, // Add recipients in BCC (they won't see each other)
//             subject: subject,
//             text: textContent,

//         };

//         console.log("📧 Sending newsletter to:", emailList.join(", "));

//         // Send mail
//         await transporter.sendMail(mailOptions);
//         console.log("✅ Newsletter email sent successfully!");

//         res.status(200).json({ message: "Newsletter sent!" });
//     } catch (error) {
//         console.error("Error sending newsletter:", error);
//         res.status(500).json({ error: "Failed to send newsletter." });
//     }
// });

// export default router;

import express from "express";
import nodemailer from "nodemailer";
import NewsletterSubscriber from "../../models/subscribeNewsLetter.js";
import { verifyAdmin } from "../../middleware/verifyAdmin.js";

const router = express.Router();

router.post("/", verifyAdmin, async (req, res) => {
    const { subject, textContent } = req.body;

    console.log("📥 Received newsletter request:", subject);

    if (!subject || !textContent) {
        console.warn("⚠️ Missing subject or HTML content");
        return res
            .status(400)
            .json({ error: "Subject and message are required" });
    }

    try {
        // Get all subscriber emails
        const subscribers = await NewsletterSubscriber.find({}, "email");
        const emailList = subscribers.map((sub) => sub.email);

        console.log(`👥 Found ${emailList.length} subscriber(s)`);

        if (emailList.length === 0) {
            return res.status(400).json({ error: "No subscribers found." });
        }

        // Create transporter
        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.MY_EMAIL,
                pass: process.env.MY_EMAIL_PASSWORD,
            },
        });

        // Loop through each email and send individually
        for (const email of emailList) {
            const mailOptions = {
                from: `<${process.env.EMAIL_USER}>`,
                to: email, // Send to each individual recipient
                subject: subject,
                text: textContent,
            };

            console.log(`📧 Sending newsletter to: ${email}`);

            // Send mail to each user
            await transporter.sendMail(mailOptions);
        }

        console.log("✅ Newsletter email sent successfully to all recipients!");

        res.status(200).json({ message: "Newsletter sent!" });
    } catch (error) {
        console.error("Error sending newsletter:", error);
        res.status(500).json({ error: "Failed to send newsletter." });
    }
});

export default router;
