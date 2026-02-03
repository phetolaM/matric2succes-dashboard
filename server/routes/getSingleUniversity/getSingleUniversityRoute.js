import express from "express";
import { getSingleUniversity } from "../../controllers/getSingleUniversity/GetSingleUniversity.js";

const router = express.Router();

router.get("/:key", getSingleUniversity);

export default router;
