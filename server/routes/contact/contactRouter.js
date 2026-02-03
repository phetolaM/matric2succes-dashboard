import express from "express";
import {
    sendContactEmail,
    getEmailsInbox,
    deleteEmailById,
} from "../../controllers/contact/contactController.js"; // Importing controller functions

const router = express.Router();

// Define the route and link it to the controller method
router.post("/send", sendContactEmail);
router.get("/inbox", getEmailsInbox);
router.delete("/inbox/:id", deleteEmailById);

export default router;
