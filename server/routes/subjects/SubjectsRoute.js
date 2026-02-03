import express from "express";
import {
    getAllSubjects,
    addSubject,
    deleteSubject,
} from "../../controllers/subjects/subjectsController.js"; // Importing controller functions
import { verifyAdmin } from "../../middleware/verifyAdmin.js";

const router = express.Router();

// Define the routes and link them to the controller methods
router.get("/", getAllSubjects);
router.post("/", verifyAdmin, addSubject);
router.delete("/:id", verifyAdmin, deleteSubject);

export default router;
