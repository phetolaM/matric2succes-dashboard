import University from "../../models/universityModels.js";

export const getSingleUniversity = async (req, res) => {
    const universityKey = req.params.key;
    try {
        // Try to find by title (acronym), case-insensitive
        let university = await University.findOne({
            title: new RegExp(`^${universityKey}$`, "i"),
        });
        // Fallback to _id for backward compatibility
        if (!university) {
            university = await University.findOne({ _id: universityKey });
        }
        if (!university) {
            return res.status(404).json({ message: "University not found" });
        }
        res.json(university);
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
};
