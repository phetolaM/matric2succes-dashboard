import express from "express";
import uploadUniList from "../../middleware/upload.js";
import { verifyAdmin } from "../../middleware/verifyAdmin.js";
import {
    getAllUniversities,
    getUniversityById,
    updateUniversity,
    deleteUniversity,
} from "../../controllers/universityCoursesController/universityList.js";

const router = express.Router();

// Public GET routes
router.get("/", getAllUniversities);
router.get("/:id", getUniversityById);

// Protected PUT/DELETE routes
router.put(
    "/:id",
    verifyAdmin,
    uploadUniList.fields([{ name: "image", maxCount: 1 }, { name: "gallery" }]),
    updateUniversity
);

router.delete("/:id", verifyAdmin, deleteUniversity);

export default router;
