import Subject from "../../models/SubjectModel.js";


// Get all subjects
export const getAllSubjects = async (req, res) => {
    try {
        const subjects = await Subject.find();
        res.json(subjects);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch subjects" });
    }
};

// Add a new subject
export const addSubject = async (req, res) => {
    const { name, isLanguage } = req.body;

    if (!name || typeof isLanguage !== "boolean") {
        console.error("Invalid data received:", req.body); // Log the received data
        return res.status(400).json({
            error: "Subject name and isLanguage (true/false) are required",
        });
    }

    try {
        const newSubject = new Subject({ name, isLanguage });
        await newSubject.save();
        res.status(201).json(newSubject);
    } catch (err) {
        console.error("Error while saving subject:", err); // Log the error if saving fails
        res.status(400).json({ error: "Failed to add subject" });
    }
};

// Delete a subject by ID
export const deleteSubject = async (req, res) => {
    try {
        const subject = await Subject.findByIdAndDelete(req.params.id);
        if (!subject) {
            return res.status(404).json({ error: "Subject not found" });
        }
        res.status(200).json({ message: "Subject deleted successfully" });
    } catch (error) {
        res.status(500).json({ error: "Server error while deleting subject" });
    }
};
