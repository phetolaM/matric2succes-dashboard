import express from "express";
import upload from "../../middleware/upload.js";
import { verifyAdmin } from "../../middleware/verifyAdmin.js";
import { addNewUniversity } from "../../controllers/addNewUniversity/AddNewUniversity.js";

const router = express.Router();

// Protect POST /api/university/add
router.post(
    "/",
    verifyAdmin,
    upload.fields([
        { name: "image", maxCount: 1 },
        { name: "gallery", maxCount: 10 },
    ]),
    addNewUniversity
);

export default router;
