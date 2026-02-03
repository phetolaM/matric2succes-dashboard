import express from "express";
import { getUnavailableUniversitiesList } from "../../controllers/unavailableUniversitiesController.js";

const router = express.Router();

router.get("/", getUnavailableUniversitiesList);

export default router;
