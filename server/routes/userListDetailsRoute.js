import express from "express";
import {
    saveApsUser,
    getApsUsers,
    deleteApsUser,
    sendNowUser,
} from "../controllers/userListDetailsController.js";
import { verifyAdmin } from "../middleware/verifyAdmin.js";

const router = express.Router();

router.post("/aps-user", saveApsUser);
router.get("/aps-users", verifyAdmin, getApsUsers);
router.post("/send-now/:id", verifyAdmin, sendNowUser);
router.delete("/:id", verifyAdmin, deleteApsUser); // <-- Add this line

export default router;
