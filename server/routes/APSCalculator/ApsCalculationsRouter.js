// routes/apsRoute.js
import express from "express";
import { calculateEligibility } from "../../controllers/APSCalcukatorController.js";

const router = express.Router();

router.post("/calculate", express.json(), calculateEligibility);

export default router;