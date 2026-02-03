import express from "express";
import {
    getAllUsers,
    addUser,
    updateUser,
    deleteUser,
} from "../../controllers/adminUser/adminUserController.js";
import { verifyAdmin } from "../../middleware/verifyAdmin.js";

const router = express.Router();

// Base route: /api/admin/users
router.get("/", verifyAdmin, getAllUsers);
router.post("/", verifyAdmin, addUser);
router.put("/:id", verifyAdmin, updateUser);
router.delete("/:id", verifyAdmin, deleteUser);

export default router;
