// routes/courseRoutes.js
import express from "express";
import {
    getUniversityCourses,
    getSingleCourse,
    addCourseToCollection,
    updateCourse,
    deleteCourse,
} from "../../controllers/coursesDetailsController.js";
import { verifyAdmin } from "../../middleware/verifyAdmin.js";

const router = express.Router();

router.get("/:collectionName/:courseId", getSingleCourse);
router.post("/:collectionName", verifyAdmin, addCourseToCollection); // ✅ add this

router.get("/:collectionName", getUniversityCourses);

// / NEW ROUTES
router.put("/:collectionName/:courseId", verifyAdmin, updateCourse);
router.delete("/:collectionName/:courseId", verifyAdmin, deleteCourse);

export default router;
