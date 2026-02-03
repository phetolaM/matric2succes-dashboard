
import multer from "multer";
import fs from "fs";
import path from "path";

// Helper function to normalize paths
const normalizePath = (filePath) => filePath.replace(/\\/g, "/");

// Ensure directories exist
const ensureDirectoryExistence = (dir) => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
};

// Set storage engine
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        let uploadPath = "";

        if (file.fieldname === "image" || file.fieldname === "gallery") {
            uploadPath = "uploads/images/";
        } else if (file.fieldname === "prospectusFiles") {
            uploadPath = "uploads/prospectus/";
        } else {
            uploadPath = "uploads/others/";
        }

        // Ensure the destination directory exists
        ensureDirectoryExistence(uploadPath);

        cb(null, uploadPath); // Set the destination
    },
    filename: (req, file, cb) => {
        const extname = path.extname(file.originalname); // Get file extension
        const uniqueName = `${Date.now()}-${file.originalname}`;
        cb(null, uniqueName); // Use timestamp + original name as file name
    },
});

// Filter file types
const fileFilter = (req, file, cb) => {
    if (file.fieldname === "image" || file.fieldname === "gallery") {
        if (!file.mimetype.startsWith("image/")) {
            return cb(new Error("Only images are allowed"));
        }
    }

    if (file.fieldname === "prospectusFiles") {
        if (file.mimetype !== "application/pdf") {
            return cb(new Error("Only PDF files are allowed"));
        }
    }

    cb(null, true); // Continue if file type is valid
};

// Multer upload middleware
const uploadUniList = multer({ storage, fileFilter });

export default uploadUniList; // Ensure to export the middleware correctly
