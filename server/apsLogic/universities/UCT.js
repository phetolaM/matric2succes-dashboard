// uct.js

export const meta = {
    code: "uct",
    displayName: "University of Cape Town",
    collections: ["uct"],
    mathSubjects: [
        "682320f89c61006b5937180c", // Mathematics
        "682346d7af0e046517c46da6", // Mathematical Literacy
        "68234b52af0e046517c46df4", // Technical Mathematics
    ],
};
export function university_of_cape_town_APS(data) {
    let totalPercent = 0;

    totalPercent += Number(data.homeLanguagePercent) || 0;
    totalPercent += Number(data.additionalLanguagePercent) || 0;
    totalPercent += Number(data.mathPercent) || 0;

    for (const subject of data.otherSubjects) {
        totalPercent += Number(subject.percent) || 0;
    }

    const aps = Math.floor(totalPercent / 10); // APS out of 60 scaled to ~6 subjects

    return {
        university: "uct",
        aps,
    };
}

// UCT-specific course qualification logic
export function getQualifiedCoursesForUCT({
    aps,
    userSubjectsMap,
    courses,
    idToName,
    MATH_ALTERNATIVE_IDS,
}) {
    const qualifiedCourses = [];

    courses.forEach((course) => {
        // UJ: Use different APS requirements based on user's maths subject
        let requiredAPS = Number(course.apsRequirement);
        if (
            userSubjectsMap["mathematics"] > 0 &&
            course.apsRequirementMathematics
        ) {
            requiredAPS = Number(course.apsRequirementMathematics);
        } else if (
            userSubjectsMap["mathematical literacy"] > 0 &&
            course.apsRequirementMathLit
        ) {
            requiredAPS = Number(course.apsRequirementMathLit);
        }

        if (aps < requiredAPS) return;

        // If no subject requirements, qualify by APS only
        if (
            !Array.isArray(course.subjectRequirements) ||
            course.subjectRequirements.length === 0
        ) {
            qualifiedCourses.push({
                name: course.courseName,
                code: course.courseCode,
                apsRequirement: course.apsRequirement,
                apsRequirementMathematics: course.apsRequirementMathematics,
                apsRequirementMathLit: course.apsRequirementMathLit,
                duration: course.duration,
                requirements: [],
                careerChoices: course.careerChoices,
            });
            return;
        }

        // Maths alternatives logic
        const mathsReqs = course.subjectRequirements.filter((req) =>
            MATH_ALTERNATIVE_IDS.includes(req.subjectId)
        );
        const otherReqs = course.subjectRequirements.filter(
            (req) => !MATH_ALTERNATIVE_IDS.includes(req.subjectId)
        );

        let mathsMet = true;
        let mathsRequirements = [];
        if (mathsReqs.length > 0) {
            mathsMet = mathsReqs.some((req) => {
                const name = idToName[req.subjectId];
                const userScore =
                    userSubjectsMap[(name || "").toLowerCase()] || 0;
                mathsRequirements.push({
                    subject: name,
                    required: req.percentage,
                    userScore,
                    met: userScore >= req.percentage,
                });
                return userScore >= req.percentage;
            });
        }

        const otherRequirements = otherReqs.map((req) => {
            const name = idToName[req.subjectId];
            const userScore = userSubjectsMap[(name || "").toLowerCase()] || 0;
            return {
                subject: name,
                required: req.percentage,
                userScore,
                met: userScore >= req.percentage,
            };
        });
        const othersMet = otherRequirements.every((r) => r.met);

        const requirements = [...mathsRequirements, ...otherRequirements];

        if (mathsMet && othersMet) {
            qualifiedCourses.push({
                name: course.courseName,
                code: course.courseCode,
                apsRequirement: course.apsRequirement,
                apsRequirementMathematics: course.apsRequirementMathematics,
                apsRequirementMathLit: course.apsRequirementMathLit,
                duration: course.duration,
                requirements: [],
                careerChoices: course.careerChoices,
            });
        }
    });

    return qualifiedCourses;
}

// Adapter to match the generic getQualifiedCourses signature used by the controller
export function getQualifiedCourses({
    aps,
    userSubjectsMap,
    courses,
    idToName,
    mathSubjects = meta.mathSubjects,
}) {
    const idToNameObj =
        idToName instanceof Map ? Object.fromEntries(idToName) : idToName;
    const userMapObj =
        userSubjectsMap instanceof Map
            ? Object.fromEntries(userSubjectsMap)
            : userSubjectsMap;
    return getQualifiedCoursesForUCT({
        aps,
        userSubjectsMap: userMapObj,
        courses,
        idToName: idToNameObj,
        MATH_ALTERNATIVE_IDS: mathSubjects,
    });
}
