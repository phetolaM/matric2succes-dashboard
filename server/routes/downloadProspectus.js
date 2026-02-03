import express from "express";
import path from "path";
import fs from "fs";

const router = express.Router();

router.get("/download/:filename", (req, res) => {
    const filename = req.params.filename;
    const filePath = path.join("uploads/prospectus", filename);

    // Check if file exists
    if (fs.existsSync(filePath)) {
        res.download(filePath); // This sets Content-Disposition: attachment
    } else {
        res.status(404).send("File not found");
    }
});

export default router;
