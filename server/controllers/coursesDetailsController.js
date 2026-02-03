// controllers/courseController.js
import mongoose from "mongoose";
import { universityCoursesDbConnection } from "../config/coursesDB/coursesDb.js";
import { ObjectId } from "mongodb";
import {
    getUniversitySchema,
    hasUniversitySchema,
} from "../models/courseSchemas/index.js";

// University-specific validators
import { validateCourseSubjects as validateUnizuluSubjects } from "../apsLogic/universities/UNIZULU.js";

const modelCache = new Map();

/**
 * Get or create a model for a specific university collection
 * Uses university-specific schema if available, otherwise uses generic schema
 */
function getUniversityModel(collectionName) {
    if (modelCache.has(collectionName)) {
        return modelCache.get(collectionName);
    }

    let schema;

    // Try to get university-specific schema
    if (hasUniversitySchema(collectionName)) {
        schema = getUniversitySchema(collectionName);
        console.log(
            `✅ Using custom schema for ${collectionName.toUpperCase()}`
        );
    } else {
        // Fallback to generic schema
        console.log(
            `⚠️  No custom schema for ${collectionName.toUpperCase()}, using generic schema`
        );
        schema = new mongoose.Schema(
            {
                courseName: String,
                courseCode: String,
                majoring: String,
                apsRequirement: Number,
                apsRequirementMathematics: Number,
                apsRequirementMathLit: Number,
                apsRequirementTechnicalMath: Number,
                duration: String,
                methodOfStudy: String,
                campuses: [String],
                careerChoices: [String],
                homeLanguageRequirement: {
                    subjectId: String,
                    percentage: Number,
                },
                additionalLanguageRequirement: {
                    subjectId: String,
                    percentage: Number,
                },
                subjectRequirements: [
                    {
                        subjectId: String,
                        percentage: Number,
                    },
                ],
                subjectRequirementGroups: [
                    [
                        {
                            subjectId: String,
                            percentage: Number,
                        },
                    ],
                ],
            },
            { collection: collectionName, strict: false, timestamps: true }
        );
    }

    const model = universityCoursesDbConnection.model(collectionName, schema);
    modelCache.set(collectionName, model);
    return model;
}

// Validate course payload for duplicate subjects across AND and OR groups
function validateCourseSubjects(course) {
    const andIds = (course.subjectRequirements || [])
        .map((r) => r.subjectId)
        .filter(Boolean);

    const groupLists = (course.subjectRequirementGroups || []).map((g) =>
        (g || []).map((it) => it.subjectId).filter(Boolean)
    );

    // Check any AND subject appears in any OR group
    for (const id of andIds) {
        for (const g of groupLists) {
            if (g.includes(id)) {
                return `Subject ${id} is listed in AND requirements and also appears in an OR group`;
            }
        }
    }

    // Note: We intentionally allow the same subject to appear in multiple OR groups.
    // The UI may warn about duplicates but backend will not block saving based on
    // subject reuse across OR groups. Only AND-in-OR conflicts are considered errors.
    return null;
}

export const getUniversityCourses = async (req, res) => {
    const { collectionName } = req.params;

    try {
        const collection =
            universityCoursesDbConnection.collection(collectionName);
        const courses = await collection.find({}).toArray();
        res.status(200).json(courses);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch courses" });
    }
};

export const getSingleCourse = async (req, res) => {
    const { collectionName, courseId } = req.params;

    try {
        const collection =
            universityCoursesDbConnection.collection(collectionName);
        const course = await collection.findOne({
            _id: new ObjectId(courseId),
        });

        if (!course) return res.status(404).json({ error: "Course not found" });

        res.status(200).json(course);
    } catch (err) {
        console.error("Error in getSingleCourse:", err);
        res.status(500).json({ error: "Failed to fetch course" });
    }
};

export const addCourseToCollection = async (req, res) => {
    const { collectionName } = req.params;
    let newCourse = req.body;

    try {
        // University-specific validation first (UNIZULU)
        if (collectionName === "unizulu") {
            const validationErr = validateUnizuluSubjects(newCourse);
            if (validationErr)
                return res.status(400).json({ error: validationErr });
        } else {
            // Generic validation fallback (if you have other generic checks)
            const validationErr = validateCourseSubjects
                ? validateCourseSubjects(newCourse)
                : null;
            if (validationErr)
                return res.status(400).json({ error: validationErr });
        }

        // Use the model with schema validation if available
        const Model = getUniversityModel(collectionName);

        // Create a new course instance with schema validation
        const courseDocument = new Model(newCourse);

        // Validate the document
        await courseDocument.validate();

        // Save the document
        const savedCourse = await courseDocument.save();

        res.status(201).json(savedCourse);
    } catch (err) {
        console.error("Error in addCourseToCollection:", err);

        // Handle validation errors
        if (err.name === "ValidationError") {
            return res.status(400).json({
                error: "Validation failed",
                details: err.errors,
            });
        }

        res.status(500).json({ error: "Failed to add course" });
    }
};

// Update course
export const updateCourse = async (req, res) => {
    const { collectionName, courseId } = req.params;
    const updatedData = req.body;

    try {
        // University-specific validation first (UNIZULU)
        if (collectionName === "unizulu") {
            const validationErr = validateUnizuluSubjects(updatedData);
            if (validationErr)
                return res.status(400).json({ error: validationErr });
        } else {
            const validationErr = validateCourseSubjects
                ? validateCourseSubjects(updatedData)
                : null;
            if (validationErr)
                return res.status(400).json({ error: validationErr });
        }

        const Model = getUniversityModel(collectionName);

        // Find the course
        const course = await Model.findById(courseId);

        if (!course) {
            return res.status(404).json({ error: "Course not found" });
        }

        // Update fields
        Object.assign(course, updatedData);

        // Validate and save
        await course.validate();
        const updatedCourse = await course.save();

        res.status(200).json(updatedCourse);
    } catch (err) {
        console.error("Error in updateCourse:", err);

        // Handle validation errors
        if (err.name === "ValidationError") {
            return res.status(400).json({
                error: "Validation failed",
                details: err.errors,
            });
        }

        res.status(500).json({ error: "Failed to update course" });
    }
};

// Delete course
export const deleteCourse = async (req, res) => {
    const { collectionName, courseId } = req.params;

    try {
        const Model = getUniversityModel(collectionName);

        const result = await Model.findByIdAndDelete(courseId);

        if (!result) {
            return res.status(404).json({ error: "Course not found" });
        }

        res.status(200).json({ message: "Course deleted successfully" });
    } catch (err) {
        console.error("Error in deleteCourse:", err);
        res.status(500).json({ error: "Failed to delete course" });
    }
};
