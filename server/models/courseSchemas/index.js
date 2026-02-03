import UJCourseSchema from "./UJCourseSchema.js";
import UPCourseSchema from "./UPCourseSchema.js";
import WSUCourseSchema from "./WSUCoursesSchema.js";
import UWCCourseSchema from "./UWCCourseSchema.js";
import TUTCourseSchema from "./TUTCourseSchema.js";
import SMUCourseSchema from "./SMUCourseSchema.js";
import MUTCourseSchema from "./MUTCourseSchema.js";
import UNISACourseSchema from "./UNISACourseSchema.js";
import UNIZULUCourseSchema from "./UNIZULUCourseSchema.js";
import NMUCourseSchema from "./NMUCourseSchema.js";

// Import more university schemas as you create them
// import UCTCourseSchema from "./UCTCourseSchema.js";
// import WITSCourseSchema from "./WITSCourseSchema.js";

/**
 * University Schema Registry
 * Maps university codes to their respective schemas
 */
export const universitySchemas = {
    uj: UJCourseSchema,
    wsu: WSUCourseSchema,
    tut: TUTCourseSchema,
    smu: SMUCourseSchema,
    mut: MUTCourseSchema,
    nmu: NMUCourseSchema,
    unisa: UNISACourseSchema,
    unizulu: UNIZULUCourseSchema,
    // up: UPCourseSchema,
    // uwc: UWCCourseSchema,
    // Add more universities here as you create their schemas
    // uct: UCTCourseSchema,
    // wits: WITSCourseSchema,
};

/**
 * Get schema for a specific university
 * @param {string} universityCode - University code (e.g., 'uj', 'up')
 * @returns {mongoose.Schema} - The schema for that university
 */
export function getUniversitySchema(universityCode) {
    const schema = universitySchemas[universityCode?.toLowerCase()];
    if (!schema) {
        throw new Error(
            `No schema found for university code: ${universityCode}`
        );
    }
    return schema;
}

/**
 * Check if a university has a custom schema
 * @param {string} universityCode - University code
 * @returns {boolean} - True if schema exists
 */
export function hasUniversitySchema(universityCode) {
    return !!universitySchemas[universityCode?.toLowerCase()];
}

/**
 * Get all supported university codes
 * @returns {string[]} - Array of university codes
 */
export function getSupportedUniversities() {
    return Object.keys(universitySchemas);
}

export default universitySchemas;
