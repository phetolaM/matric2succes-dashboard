import { getUnavailableUniversities } from "../apsLogic/Index.js";

export async function getUnavailableUniversitiesList(req, res) {
    try {
        const unavailableUniversities = getUnavailableUniversities();
        res.json({
            success: true,
            universities: unavailableUniversities,
        });
    } catch (error) {
        console.error("Error fetching unavailable universities:", error);
        res.status(500).json({
            success: false,
            error: "Internal server error",
        });
    }
}
