import express from "express";
import {
    connectUniversityCoursesDB,
    universityCoursesDbConnection,
} from "../../config/coursesDB/coursesDb.js";

const router = express.Router();

// GET /api/universities → returns collection names like ['uj', 'up', 'uwc', 'wsu']
router.get("/", async (req, res) => {
    try {
        // await connectUniversityCoursesDB();

        const collections = await universityCoursesDbConnection.db
            .listCollections()
            .toArray();
        const collectionNames = collections.map((col) => col.name);

        res.json(collectionNames);
    } catch (err) {
        console.error("Error fetching university collections:", err);
        res.status(500).json({
            error: "Failed to fetch university collections",
        });
    }
});

export default router;
