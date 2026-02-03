// models/newsletterModel.js
import mongoose from "mongoose";
import { newsletterDbConnection } from "../config/newsletter/newsLetterSubscription.js";

const newsletterSchema = new mongoose.Schema(
    {
        email: {
            type: String,
            required: true,
            unique: true,
        },
        subscribedAt: {
            type: Date,
            default: Date.now,
        },
    },
    { collection: "subscribers" }
);

const NewsletterSubscriber = newsletterDbConnection.model("NewsletterSubscriber", newsletterSchema);

export default NewsletterSubscriber;
