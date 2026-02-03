import University from "../../models/universityModels.js";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const normalizePath = (path) => path.replace(/\\/g, "/");

const deleteFile = async (relativePath) => {
    if (!relativePath) return;
    const cleanedPath = relativePath.replace(/^\/+/, "");
    const filePath = path.resolve(__dirname, "..", cleanedPath);
    try {
        await fs.unlink(filePath);
        console.log("✅ Deleted:", filePath);
    } catch (err) {
        console.error("❌ Failed to delete file:", err.message);
    }
};

// @desc Get all universities
export const getAllUniversities = async (req, res) => {
    try {
        const universities = await University.find();
        res.json(universities);
    } catch (err) {
        res.status(500).json({ error: "Error fetching universities" });
    }
};

// @desc Get a single university
export const getUniversityById = async (req, res) => {
    try {
        const university = await University.findById(req.params.id);
        if (!university)
            return res.status(404).json({ error: "University not found" });
        res.json(university);
    } catch (err) {
        res.status(500).json({ error: "Error fetching university" });
    }
};

// @desc Update a university
export const updateUniversity = async (req, res) => {
    try {
        const {
            title,
            subtitle,
            history,
            officialLink,
            isApplicationOpen,
            contactAddress,
            contactPhone,
            contactEmail,
            statsCourses,
            statsCampuses,
            existingGallery,
            existingProspectus,
            applicationFee, // <-- ADD THIS
        } = req.body;

        const updatedData = {
            title,
            subtitle,
            history,
            officialLink,
            isApplicationOpen: isApplicationOpen === "true",
            contact: {
                address: contactAddress,
                phone: contactPhone,
                email: contactEmail,
            },
            stats: {
                courses: statsCourses,
                campuses: statsCampuses,
            },
            applicationFee:
                applicationFee !== undefined && applicationFee !== ""
                    ? Number(applicationFee)
                    : undefined, // <-- ADD THIS
        };

        if (req.files.image?.length > 0) {
            updatedData.image = normalizePath(
                `/uploads/images/${req.files.image[0].filename}`
            );
        }

        const existingGalleryArray = Array.isArray(existingGallery)
            ? existingGallery
            : JSON.parse(existingGallery || "[]");

        const newGalleryFiles =
            req.files.gallery?.map((file) =>
                normalizePath(`/uploads/images/${file.filename}`)
            ) || [];

        updatedData.gallery = [
            ...existingGalleryArray.filter(
                (item) => typeof item === "string" && item.trim() !== ""
            ),
            ...newGalleryFiles,
        ];

        const existingProspectusArray = Array.isArray(existingProspectus)
            ? existingProspectus
            : JSON.parse(existingProspectus || "[]");

        const prospectusMetaArray = JSON.parse(req.body.prospectus || "[]");

        const newProspectusCombined = prospectusMetaArray.map((item) => ({
            name: item.name,
            year: item.year,
            link: item.link, // Just use the link directly
        }));

        updatedData.prospectus = newProspectusCombined;

        const updatedUniversity = await University.findByIdAndUpdate(
            req.params.id,
            updatedData,
            { new: true }
        );

        if (!updatedUniversity)
            return res.status(404).json({ error: "University not found" });

        res.json({
            message: "University updated",
            university: updatedUniversity,
        });
    } catch (err) {
        console.error("❌ Error updating university:", err);
        res.status(500).json({
            error: "Error updating university",
            details: err.message,
        });
    }
};

// @desc Delete university and related files
export const deleteUniversity = async (req, res) => {
    try {
        const deletedUniversity = await University.findByIdAndDelete(
            req.params.id
        );
        if (!deletedUniversity)
            return res.status(404).json({ error: "University not found" });

        const filesToDelete = new Set();

        if (deletedUniversity.image) filesToDelete.add(deletedUniversity.image);
        deletedUniversity.gallery?.forEach(
            (img) => img && filesToDelete.add(img)
        );

        res.json({
            message: "University deleted",
            university: deletedUniversity,
        });
    } catch (err) {
        console.error("❌ Error deleting university:", err);
        res.status(500).json({ error: "Error deleting university" });
    }
};
