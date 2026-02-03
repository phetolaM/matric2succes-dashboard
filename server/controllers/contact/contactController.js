import { createEmailInboxConnection } from "../../config/emailInboxDB/emailInboxDB.js";
import { createEmailModel } from "../../models/emailInboxModel.js";

// Lazy init: create connection and model on first use
let emailModel = null;
async function ensureEmailModel() {
    if (emailModel) return emailModel;
    const conn = await createEmailInboxConnection();
    emailModel = createEmailModel(conn);
    return emailModel;
}

// Save contact form submission to emailsInbox.json
export const sendContactEmail = async (req, res) => {
    const { name, email, subject, message } = req.body;

    console.log("Received contact form data:", {
        name,
        email,
        subject,
        message,
    });
    try {
        const Model = await ensureEmailModel();
        await Model.create({
            name: name || "",
            email: email || "",
            subject: subject || "",
            message: message || "",
            receivedAt: new Date(),
            ip: req.ip || null,
        });
        return res.status(200).json({ success: true });
    } catch (err) {
        console.error("Failed to save contact submission to DB:", err);
        return res
            .status(500)
            .json({ success: false, error: "Failed to save message." });
    }
};

// Read inbox entries
export const getEmailsInbox = async (req, res) => {
    try {
        const Model = await ensureEmailModel();
        const docs = await Model.find().sort({ receivedAt: -1 }).lean();
        return res.status(200).json(docs);
    } catch (err) {
        console.error("Failed to read inbox from DB:", err);
        return res
            .status(500)
            .json({ success: false, error: "Failed to read inbox." });
    }
};

// Delete a single inbox entry by id
export const deleteEmailById = async (req, res) => {
    const { id } = req.params;
    if (!id)
        return res.status(400).json({ success: false, error: "Missing id" });
    try {
        const Model = await ensureEmailModel();
        const doc = await Model.findByIdAndDelete(id);
        if (!doc)
            return res.status(404).json({ success: false, error: "Not found" });
        return res.status(200).json({ success: true });
    } catch (err) {
        console.error("Failed to delete inbox entry:", err);
        return res
            .status(500)
            .json({ success: false, error: "Failed to delete entry." });
    }
};
