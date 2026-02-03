// Schema mapping showing which fields each university uses
export const UNIVERSITY_COURSE_SCHEMAS = {
    mut: {
        displayName: "Mangosuthu University of Technology",
        fields: [
            { name: "courseName", type: "text", required: true },
            { name: "courseCode", type: "text", required: true },
            { name: "duration", type: "text" },
            { name: "methodOfStudy", type: "text" },
            { name: "careerChoices", type: "array", itemType: "text" },
            { name: "accessCourse", type: "boolean" },
            {
                name: "languageRequirementOperator",
                type: "select",
                options: ["both", "either"],
            },
            { name: "subjectRequirements", type: "array", itemType: "object" },
            {
                name: "subjectRequirementGroups",
                type: "array",
                itemType: "array",
            },
            {
                name: "subjectCombinationGroups",
                type: "array",
                itemType: "array",
            },
            {
                name: "additionalRequirements",
                type: "array",
                itemType: "object",
            },
        ],
    },
    nmu: {
        displayName: "Nelson Mandela University",
        fields: [
            { name: "courseName", type: "text", required: true },
            { name: "faculty", type: "text" },
            { name: "majoring", type: "text" },
            {
                name: "level",
                type: "select",
                options: ["Diploma", "Higher Certificate", "Bachelors Degree"],
            },
            { name: "duration", type: "text" },
            { name: "methodOfStudy", type: "text" },
            { name: "notes", type: "array", itemType: "text" },
            { name: "careerChoices", type: "array", itemType: "text" },
            { name: "apsRequirementMathematics", type: "number" },
            { name: "apsRequirementMathLit", type: "number" },
            { name: "apsRequirementTechnicalMath", type: "number" },
            { name: "languageRequirements", type: "array", itemType: "object" },
            { name: "subjectRequirements", type: "array", itemType: "object" },
            {
                name: "subjectRequirementGroups",
                type: "array",
                itemType: "array",
            },
            { name: "notApplicableSubjects", type: "array", itemType: "text" },
            {
                name: "additionalRequirements",
                type: "array",
                itemType: "object",
            },
        ],
    },
    tut: {
        displayName: "Tshwane University of Technology",
        fields: [
            { name: "courseName", type: "text", required: true },
            { name: "majoring", type: "text" },
            { name: "duration", type: "text" },
            { name: "methodOfStudy", type: "text" },
            { name: "careerChoices", type: "array", itemType: "text" },
            { name: "apsRequirement", type: "number" },
            {
                name: "apsRequirementVariants",
                type: "array",
                itemType: "object",
            },
            { name: "subjectRequirements", type: "array", itemType: "object" },
            {
                name: "subjectRequirementGroups",
                type: "array",
                itemType: "array",
            },
            { name: "notApplicableSubjects", type: "array", itemType: "text" },
        ],
    },
    uj: {
        displayName: "University of Johannesburg",
        fields: [
            { name: "courseName", type: "text", required: true },
            { name: "courseCode", type: "text" },
            { name: "majoring", type: "text" },
            { name: "duration", type: "text" },
            { name: "methodOfStudy", type: "text" },
            { name: "campuses", type: "array", itemType: "text" },
            { name: "careerChoices", type: "array", itemType: "text" },
            { name: "apsRequirement", type: "number" },
            { name: "languageRequirements", type: "array", itemType: "object" },
            { name: "subjectRequirements", type: "array", itemType: "object" },
            {
                name: "subjectRequirementGroups",
                type: "array",
                itemType: "array",
            },
            { name: "notApplicableSubjects", type: "array", itemType: "text" },
        ],
    },
    unisa: {
        displayName: "University of South Africa",
        fields: [
            { name: "courseName", type: "text", required: true },
            { name: "courseCode", type: "text" },
            { name: "majoring", type: "text" },
            { name: "level", type: "text" },
            { name: "duration", type: "text" },
            { name: "careerChoices", type: "array", itemType: "text" },
            { name: "apsRequirement", type: "number" },
            { name: "subjectRequirements", type: "array", itemType: "object" },
            {
                name: "subjectRequirementGroups",
                type: "array",
                itemType: "array",
            },
            { name: "languageRequirements", type: "array", itemType: "object" },
        ],
    },
    ukzn: {
        displayName: "University of KwaZulu-Natal",
        fields: [
            { name: "courseName", type: "text", required: true },
            { name: "courseCode", type: "text" },
            { name: "majoring", type: "text" },
            { name: "level", type: "text" },
            { name: "duration", type: "text" },
            { name: "careerChoices", type: "array", itemType: "text" },
            { name: "apsRequirement", type: "number" },
            { name: "subjectRequirements", type: "array", itemType: "object" },
            {
                name: "subjectRequirementGroups",
                type: "array",
                itemType: "array",
            },
            {
                name: "subjectRequirementCombinations",
                type: "array",
                itemType: "array",
            },
        ],
    },
    wsu: {
        displayName: "Walter Sisulu University",
        fields: [
            { name: "courseName", type: "text", required: true },
            { name: "courseCode", type: "text" },
            { name: "majoring", type: "text" },
            { name: "duration", type: "text" },
            { name: "methodOfStudy", type: "text" },
            { name: "campuses", type: "array", itemType: "text" },
            { name: "careerChoices", type: "array", itemType: "text" },
            { name: "apsRequirement", type: "number" },
            { name: "subjectRequirements", type: "array", itemType: "object" },
            {
                name: "subjectRequirementGroups",
                type: "array",
                itemType: "array",
            },
            { name: "hasExtended", type: "boolean" },
            { name: "departmentCode", type: "text" },
            { name: "facultyCode", type: "text" },
            { name: "ujSpecialField", type: "text" },
            { name: "allowLifeOrientation", type: "boolean" },
            { name: "notApplicableSubjects", type: "array", itemType: "text" },
        ],
    },
    smu: {
        displayName: "Sefako Makgatho Health Sciences University",
        fields: [
            { name: "courseName", type: "text", required: true },
            { name: "courseCode", type: "text" },
            { name: "majoring", type: "text" },
            { name: "duration", type: "text" },
            { name: "methodOfStudy", type: "text" },
            { name: "careerChoices", type: "array", itemType: "text" },
            { name: "apsRequirement", type: "number" },
            { name: "subjectRequirements", type: "array", itemType: "object" },
            {
                name: "subjectRequirementGroups",
                type: "array",
                itemType: "array",
            },
        ],
    },
};

// Get schema for a specific university
export function getUniversitySchema(code) {
    return UNIVERSITY_COURSE_SCHEMAS[code.toLowerCase()];
}

// Get field definition for a specific university and field
export function getFieldDef(code, fieldName) {
    const schema = getUniversitySchema(code);
    if (!schema) return null;
    return schema.fields.find((f) => f.name === fieldName);
}

// Check if a field is required
export function isFieldRequired(code, fieldName) {
    const field = getFieldDef(code, fieldName);
    return field?.required === true;
}
