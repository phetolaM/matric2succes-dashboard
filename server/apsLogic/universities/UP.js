export const meta = {
    code: "up",
    displayName: "University of Pretoria",
    collections: ["up"],
    mathSubjects: [
        "682320f89c61006b5937180c", // Mathematics
        "682346d7af0e046517c46da6", // Mathematical Literacy
        "68234b52af0e046517c46df4", // Technical Mathematics
    ],
};

export function calculateAPS(data) {
    function percentToAps(percent) {
        if (percent >= 80) return 7;
        if (percent >= 70) return 6;
        if (percent >= 60) return 5;
        if (percent >= 50) return 4;
        if (percent >= 40) return 3;
        if (percent >= 30) return 2;
        return 1;
    }

    // Gather all academic subjects (excluding Life Orientation)
    let subjectPercents = [];

    // Home Language
    if (data.homeLanguage && !/life orientation/i.test(data.homeLanguage)) {
        subjectPercents.push(Number(data.homeLanguagePercent || 0));
    }

    // Additional Language
    if (
        data.additionalLanguage &&
        !/life orientation/i.test(data.additionalLanguage)
    ) {
        subjectPercents.push(Number(data.additionalLanguagePercent || 0));
    }

    // Mathematics (best of the three, but only count once)
    const mathSubjects = [
        { name: data.mathSubject, percent: data.mathPercent },
        { name: data.technicalMathSubject, percent: data.technicalMathPercent },
        { name: data.mathLitSubject, percent: data.mathLitPercent },
    ];
    const bestMath = mathSubjects
        .filter((s) => s.name && !/life orientation/i.test(s.name))
        .reduce((best, s) => (s.percent > (best.percent || 0) ? s : best), {
            percent: 0,
        });
    if (bestMath.percent > 0) {
        subjectPercents.push(Number(bestMath.percent));
    }

    // Other Subjects (excluding Life Orientation)
    (data.otherSubjects || []).forEach((subject) => {
        if (subject.subject && !/life orientation/i.test(subject.subject)) {
            subjectPercents.push(Number(subject.percent || 0));
        }
    });

    // Take the best 6 subjects (excluding LO)
    subjectPercents = subjectPercents.sort((a, b) => b - a).slice(0, 6);

    // Calculate APS for best 6
    let totalAPS = subjectPercents.reduce(
        (sum, percent) => sum + percentToAps(percent),
        0
    );

    console.log(`UP APS Score:  ${totalAPS}`);
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
            console.log(
                "\n====== Evaluating course:",
                course.courseName,
                "======"
            );

            console.log("APS Requirement (General):", course.apsRequirement);
            console.log(
                "APS Requirement (Math):",
                course.apsRequirementMathematics
            );
            console.log(
                "APS Requirement (Math Lit):",
                course.apsRequirementMathLit
            );
            console.log(
                "APS Requirement (Tech Math):",
                course.apsRequirementTechnicalMath
            );

            console.log("User Math APS:", userSubjectsMap.get("mathematics"));
            console.log(
                "User Math Lit APS:",
                userSubjectsMap.get("mathematical literacy")
            );
            console.log(
                "User Tech Math APS:",
                userSubjectsMap.get("technical mathematics")
            );

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

            console.log("User APS:", aps, "| Required APS:", requiredAPS);

            // --- Home Language Requirement ---
            let meetsHomeLanguage = true;
            if (
                course.homeLanguageRequirement &&
                course.homeLanguageRequirement.percentage
            ) {
                const required = course.homeLanguageRequirement;
                const requiredPercent = Number(required.percentage); // <-- FIX
                if (required.subjectId === "all") {
                    meetsHomeLanguage =
                        typeof userSubjectsMap.get("home language") ===
                            "number" &&
                        userSubjectsMap.get("home language") >= requiredPercent;
                } else if (required.subjectId) {
                    const subjectName = idToName
                        .get(required.subjectId)
                        ?.toLowerCase();
                    meetsHomeLanguage =
                        userSubjectsMap.get("home language subject") ===
                            subjectName &&
                        userSubjectsMap.get("home language") >= requiredPercent;
                }
            }

            // --- Additional Language Requirement ---
            let meetsAdditionalLanguage = true;
            if (
                course.additionalLanguageRequirement &&
                course.additionalLanguageRequirement.percentage
            ) {
                const required = course.additionalLanguageRequirement;
                const requiredPercent = Number(required.percentage); // <-- FIX
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
                        userSubjectsMap.get("additional language subject") ===
                            subjectName &&
                        userSubjectsMap.get("additional language") >=
                            requiredPercent;
                }
            }

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
                    return userPercent >= req.percentage;
                });

            const meetsOther =
                !otherReqs?.length ||
                otherReqs.every((req) => {
                    const subject = idToName.get(req.subjectId)?.toLowerCase();
                    const userPercent = userSubjectsMap.get(subject) || 0;
                    return userPercent >= req.percentage;
                });

            const meetsGroups =
                !course.subjectRequirementGroups?.length ||
                course.subjectRequirementGroups.every((group) => {
                    return group.some((req) => {
                        const subject = idToName
                            .get(req.subjectId)
                            ?.toLowerCase();
                        const userPercent = userSubjectsMap.get(subject) || 0;
                        return userPercent >= req.percentage;
                    });
                });

            // --- Final decision includes new language checks ---
            const finalDecision =
                aps >= (course.apsRequirement || 0) &&
                meetsMath &&
                meetsOther &&
                meetsGroups &&
                meetsHomeLanguage &&
                meetsAdditionalLanguage;

            console.log("Meets Math:", meetsMath);
            console.log("Meets Other:", meetsOther);
            console.log("Meets Subject Groups:", meetsGroups);
            console.log("Meets Home Language:", meetsHomeLanguage);
            console.log("Meets Additional Language:", meetsAdditionalLanguage);

            console.log(
                ">>> Final Decision:",
                finalDecision ? "QUALIFIES ✅" : "Does NOT Qualify ❌"
            );

            return finalDecision;
        })
        .map((course) => ({
            name: course.courseName,
            code: course.courseCode,
            apsRequirement: course.apsRequirement,
            apsRequirementMathematics: course.apsRequirementMathematics,
            apsRequirementMathLit: course.apsRequirementMathLit,
            apsRequirementTechnicalMath: course.apsRequirementTechnicalMath,
            methodOfStudy: course.methodOfStudy,

            majoring: course.majoring,
            duration: course.duration,
            careerChoices: course.careerChoices,
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
