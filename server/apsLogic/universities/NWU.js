export const meta = {
    code: "nwu",
    displayName: "North West University",
    collections: ["nwu"],
    mathSubjects: [
        "682320f89c61006b5937180c", // Mathematics
        "682346d7af0e046517c46da6", // Mathematical Literacy
        "68234b52af0e046517c46df4", // Technical Mathematics
    ],
};

export function calculateAPS(data) {
    let totalAPS = 0;

    function percentToAps(percent) {
        if (percent >= 90) return 8;
        if (percent >= 80) return 7;
        if (percent >= 70) return 6;
        if (percent >= 60) return 5;
        if (percent >= 50) return 4;
        if (percent >= 40) return 3;
        if (percent >= 30) return 2;
        return 1;
    }

    // Home Language
    totalAPS += percentToAps(data.homeLanguagePercent || 0);

    // Additional Language
    totalAPS += percentToAps(data.additionalLanguagePercent || 0);

    // Mathematics (highest qualifying subject)
    const mathScore = Math.max(
        data.mathPercent || 0,
        data.technicalMathPercent || 0,
        data.mathLitPercent || 0
    );
    totalAPS += percentToAps(mathScore);

    // Other Subjects (excluding Life Orientation)
    (data.otherSubjects || []).forEach((subject) => {
        if (!/life orientation/i.test(subject.subject)) {
            totalAPS += percentToAps(subject.percent || 0);
        }
    });
    console.log(`NWU Aps Score:  ${totalAPS}`);
    return { aps: totalAPS };
}

export function getQualifiedCourses({
    aps,
    userSubjectsMap,
    courses,
    idToName,

    mathSubjects = meta.mathSubjects,
}) {
    return courses
        .filter((course) => {
            // console.log("\n====== Evaluating course:", course.courseName, "======");

            // console.log("APS Requirement (General):", course.apsRequirement);
            // console.log("APS Requirement (Math):", course.apsRequirementMathematics);
            // console.log("APS Requirement (Math Lit):", course.apsRequirementMathLit);
            // console.log("APS Requirement (Tech Math):", course.apsRequirementTechnicalMath);

            // console.log("User Math APS:", userSubjectsMap.get("mathematics"));
            // console.log("User Math Lit APS:", userSubjectsMap.get("mathematical literacy"));
            // console.log("User Tech Math APS:", userSubjectsMap.get("technical mathematics"));

            const hasMath = userSubjectsMap.get("mathematics") > 0;
            const hasTechMath =
                userSubjectsMap.get("technical mathematics") > 0;
            const hasMathLit = userSubjectsMap.get("mathematical literacy") > 0;

            let requiredAPS = course.apsRequirement;
            if (hasMath && course.apsRequirementMathematics) {
                requiredAPS = course.apsRequirementMathematics;
            } else if (hasTechMath && course.apsRequirementTechnicalMath) {
                requiredAPS = course.apsRequirementTechnicalMath;
            } else if (hasMathLit && course.apsRequirementMathLit) {
                requiredAPS = course.apsRequirementMathLit;
            }

            // console.log("User APS:", aps, "| Required APS:", requiredAPS);

            const mathReqs = course.subjectRequirements?.filter((req) =>
                mathSubjects.includes(req.subjectId)
            );

            const otherReqs = course.subjectRequirements?.filter(
                (req) => !mathSubjects.includes(req.subjectId)
            );

            const meetsMath =
                !mathReqs?.length ||
                mathReqs.some((req) => {
                    const subject = idToName.get(req.subjectId)?.toLowerCase();
                    const userPercent = userSubjectsMap.get(subject) || 0;
                    // console.log(
                    // `Checking MATH Subject: ${subject} | Required: ${req.percentage} | User: ${userPercent}`
                    // );
                    return userPercent >= req.percentage;
                });

            const meetsOther =
                !otherReqs?.length ||
                otherReqs.every((req) => {
                    const subject = idToName.get(req.subjectId)?.toLowerCase();
                    const userPercent = userSubjectsMap.get(subject) || 0;
                    // console.log(
                    //     `Checking OTHER Subject: ${subject} | Required: ${req.percentage} | User: ${userPercent}`
                    // );
                    return userPercent >= req.percentage;
                });

            const meetsGroups =
                !course.subjectRequirementGroups?.length ||
                course.subjectRequirementGroups.every((group, groupIndex) => {
                    console.log(`\nChecking Subject Group ${groupIndex + 1}:`);
                    return group.some((req) => {
                        const subject = idToName
                            .get(req.subjectId)
                            ?.toLowerCase();
                        const userPercent = userSubjectsMap.get(subject) || 0;
                        // console.log(
                        //     ` - ${subject} | Required: ${req.percentage} | User: ${userPercent}`
                        // );
                        return userPercent >= req.percentage;
                    });
                });

            // --- Home Language Requirement ---
            let meetsHomeLanguage = true;
            if (
                course.homeLanguageRequirement &&
                course.homeLanguageRequirement.percentage
            ) {
                const required = course.homeLanguageRequirement;
                const requiredPercent = Number(required.percentage);
                if (required.subjectId === "all") {
                    // Accept any home language
                    meetsHomeLanguage =
                        typeof userSubjectsMap.get("home language") ===
                            "number" &&
                        userSubjectsMap.get("home language") >= requiredPercent;
                } else if (required.subjectId) {
                    const subjectName = idToName
                        .get(required.subjectId)
                        ?.toLowerCase();
                    meetsHomeLanguage =
                        userSubjectsMap.get(subjectName) >= requiredPercent;
                }
            }

            // --- Additional Language Requirement ---
            let meetsAdditionalLanguage = true;
            if (
                course.additionalLanguageRequirement &&
                course.additionalLanguageRequirement.percentage
            ) {
                const required = course.additionalLanguageRequirement;
                const requiredPercent = Number(required.percentage);
                if (required.subjectId === "all") {
                    meetsAdditionalLanguage =
                        typeof userSubjectsMap.get("additional language") ===
                            "number" &&
                        userSubjectsMap.get("additional language") >=
                            requiredPercent;
                } else if (required.subjectId) {
                    const subjectName = idToName
                        .get(required.subjectId)
                        ?.toLowerCase();
                    meetsAdditionalLanguage =
                        userSubjectsMap.get(subjectName) >= requiredPercent;
                }
            }

            const finalDecision =
                aps >= requiredAPS &&
                meetsMath &&
                meetsOther &&
                meetsGroups &&
                meetsHomeLanguage &&
                meetsAdditionalLanguage;

            // console.log(">>> Final Decision:", finalDecision ? "QUALIFIES ✅" : "Does NOT Qualify ❌");

            return finalDecision;
        })
        .map((course) => ({
            name: course.courseName,
            code: course.courseCode,
            apsRequirement: course.apsRequirement,
            apsRequirementMathematics: course.apsRequirementMathematics,
            apsRequirementMathLit: course.apsRequirementMathLit,
            duration: course.duration,
            careerChoices: course.careerChoices,
            method: course.method,
            campuses: course.campuses,
            requirements: course.subjectRequirements?.map((req) => ({
                subject: idToName.get(req.subjectId) || "Unknown Subject",
                required: req.percentage,
            })),
            requirementGroups: course.subjectRequirementGroups?.map((group) =>
                group.map((req) => ({
                    subject: idToName.get(req.subjectId) || "Unknown Subject",
                    required: req.percentage,
                }))
            ),
            homeLanguageRequirement: course.homeLanguageRequirement
                ? {
                      subject:
                          course.homeLanguageRequirement.subjectId === "all"
                              ? "All Languages"
                              : idToName.get(
                                    course.homeLanguageRequirement.subjectId
                                ) || "Unknown Subject",
                      percentage: course.homeLanguageRequirement.percentage,
                  }
                : null,
            additionalLanguageRequirement: course.additionalLanguageRequirement
                ? {
                      subject:
                          course.additionalLanguageRequirement.subjectId ===
                          "all"
                              ? "All Languages"
                              : idToName.get(
                                    course.additionalLanguageRequirement
                                        .subjectId
                                ) || "Unknown Subject",
                      percentage:
                          course.additionalLanguageRequirement.percentage,
                  }
                : null,
        }));
}
