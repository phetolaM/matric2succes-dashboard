import University from "../../models/universityModels.js";

const normalizePath = (path) => path.replace(/\\/g, "/");

export const addNewUniversity = async (req, res) => {
    try {
        const {
            title,
            subtitle,
            history,
            officialLink,
            contactAddress,
            contactPhone,
            contactEmail,
            statsCourses,
            statsCampuses,
            isApplicationOpen,
            prospectusList, // stringified JSON array
            campusesList, // stringified JSON array
            applicationFee,
        } = req.body;

        // Parse prospectus
        let prospectus = [];
        try {
            prospectus = JSON.parse(prospectusList);
        } catch (err) {
            return res
                .status(400)
                .json({ error: "Invalid prospectus data format" });
        }

        // Parse campuses
        let campuses = [];
        try {
            campuses = campusesList ? JSON.parse(campusesList) : [];
        } catch (err) {
            return res
                .status(400)
                .json({ error: "Invalid campuses data format" });
        }

        // Build stats object only with valid numbers
        const stats = {};
        if (!isNaN(parseInt(statsCourses)))
            stats.courses = parseInt(statsCourses);
        if (!isNaN(parseInt(statsCampuses)))
            stats.campuses = parseInt(statsCampuses);

        const newUniversity = new University({
            title,
            subtitle,
            history,
            officialLink,
            image: req.files["image"]?.[0]?.path
                ? normalizePath(req.files["image"]?.[0]?.path)
                : "",
            gallery:
                req.files["gallery"]?.map((f) => normalizePath(f.path)) || [],
            prospectus: prospectus.map((p) => ({
                name: p.name,
                year: p.year ? parseInt(p.year) : undefined,
                link: p.link,
            })),
            campusesList: campuses,
            contact: {
                address: contactAddress,
                phone: contactPhone,
                email: contactEmail,
            },
            stats: stats, // Only include if not empty
            isApplicationOpen:
                isApplicationOpen === "true" || isApplicationOpen === true,
            applicationFee: applicationFee
                ? parseFloat(applicationFee)
                : undefined,
        });

        const saved = await newUniversity.save();
        res.status(201).json(saved);
    } catch (err) {
        console.error("Add error:", err);
        res.status(500).json({
            error: "Failed to add university",
            details:
                process.env.NODE_ENV === "development"
                    ? err.message
                    : undefined,
        });
    }
};
