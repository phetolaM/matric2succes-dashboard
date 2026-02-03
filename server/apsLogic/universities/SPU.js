export const meta = {
    code: "spu",
    displayName: "Sol Plaatje University ",
    collections: ["spu"],
    mathSubjects: [
        "682320f89c61006b5937180c", // Mathematics
        "682346d7af0e046517c46da6", // Mathematical Literacy
        "68234b52af0e046517c46df4", // Technical Mathematics
    ],
};

export function calculateAPS(data) {
    let totalAPS = 0;

    function percentToSPUPoints(percent) {
        if (percent >= 90) return 8;
        if (percent >= 80) return 7;
        if (percent >= 70) return 6;
        if (percent >= 60) return 5;
        if (percent >= 50) return 4;
        if (percent >= 40) return 3;
        if (percent >= 30) return 2;
        return 1;
    }

    function lifeOrientationPoints(percent) {
        if (percent >= 90) return 4;
        if (percent >= 80) return 3;
        if (percent >= 70) return 2;
        if (percent >= 60) return 1;
        return 0;
    }

    // Home Language +2 bonus
    const homeLangPercent = data.homeLanguagePercent || 0;
    let homeLangAPS = percentToSPUPoints(homeLangPercent);
    if (homeLangPercent >= 50) homeLangAPS += 2;
    totalAPS += homeLangAPS;

    // Additional Language (no bonus)
    totalAPS += percentToSPUPoints(data.additionalLanguagePercent || 0);

    // Mathematics bonus only for standard Mathematics
    const mathPercent = data.mathPercent || 0;
    const mathLitPercent = data.mathLitPercent || 0;
    const techMathPercent = data.technicalMathPercent || 0;

    let bestMathPercent = mathPercent;
    let mathAPS = percentToSPUPoints(bestMathPercent);

    if (mathPercent >= 50) {
        // Only add bonus for standard Mathematics
        mathAPS += 2;
    }

    // If Math was not taken, pick best of the other math types (without bonus)
    if (mathPercent === 0) {
        const altMathPercent = Math.max(mathLitPercent, techMathPercent);
        mathAPS = percentToSPUPoints(altMathPercent); // no bonus for math lit or tech math
    }

    totalAPS += mathAPS;

    // Other subjects (excluding Life Orientation)
    (data.otherSubjects || []).forEach((subject) => {
        if (!/life orientation/i.test(subject.subject)) {
            totalAPS += percentToSPUPoints(subject.percent || 0);
        }
    });

    // Life Orientation — scored separately
    const lifeOrientation = data.otherSubjects?.find((s) =>
        /life orientation/i.test(s.subject)
    );
    if (lifeOrientation) {
        totalAPS += lifeOrientationPoints(lifeOrientation.percent || 0);
    }

    console.log(`SPU APS Score: ${totalAPS}`);
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

            // console.log("Meets Math:", meetsMath);
            // console.log("Meets Other:", meetsOther);
            // console.log("Meets Subject Groups:", meetsGroups);

            // --- Structured Home/Additional Language Requirement (SPU-specific) ---
            let meetsLanguageRequirement = true;
            if (
                course.homeLanguageRequirement &&
                course.additionalLanguageRequirement &&
                course.homeLanguageRequirement.subjectId &&
                course.additionalLanguageRequirement.subjectId &&
                course.homeLanguageRequirement.subjectId ===
                    course.additionalLanguageRequirement.subjectId
            ) {
                // Both requirements are for the same subject (e.g., English)
                const subjectName = idToName
                    .get(course.homeLanguageRequirement.subjectId)
                    ?.toLowerCase();

                // User's HL and AL percent for this subject
                const userHLSubject = userSubjectsMap.get(
                    "home language subject"
                );
                const userHLPercent = userSubjectsMap.get("home language") || 0;
                const userALSubject = userSubjectsMap.get(
                    "additional language subject"
                );
                const userALPercent =
                    userSubjectsMap.get("additional language") || 0;

                const hlMet =
                    userHLSubject === subjectName &&
                    userHLPercent >=
                        Number(course.homeLanguageRequirement.percentage);

                const alMet =
                    userALSubject === subjectName &&
                    userALPercent >=
                        Number(course.additionalLanguageRequirement.percentage);

                meetsLanguageRequirement = hlMet || alMet;
            } else {
                // Standard logic for HL
                if (
                    course.homeLanguageRequirement &&
                    course.homeLanguageRequirement.percentage
                ) {
                    const required = course.homeLanguageRequirement;
                    const requiredPercent = Number(required.percentage);
                    if (required.subjectId === "all") {
                        meetsLanguageRequirement =
                            typeof userSubjectsMap.get("home language") ===
                                "number" &&
                            userSubjectsMap.get("home language") >=
                                requiredPercent;
                    } else if (required.subjectId) {
                        const subjectName = idToName
                            .get(required.subjectId)
                            ?.toLowerCase();
                        meetsLanguageRequirement =
                            userSubjectsMap.get("home language subject") ===
                                subjectName &&
                            userSubjectsMap.get("home language") >=
                                requiredPercent;
                    }
                }
                // Standard logic for AL
                if (
                    course.additionalLanguageRequirement &&
                    course.additionalLanguageRequirement.percentage
                ) {
                    const required = course.additionalLanguageRequirement;
                    const requiredPercent = Number(required.percentage);
                    if (required.subjectId === "all") {
                        meetsLanguageRequirement =
                            meetsLanguageRequirement &&
                            typeof userSubjectsMap.get(
                                "additional language"
                            ) === "number" &&
                            userSubjectsMap.get("additional language") >=
                                requiredPercent;
                    } else if (required.subjectId) {
                        const subjectName = idToName
                            .get(required.subjectId)
                            ?.toLowerCase();
                        meetsLanguageRequirement =
                            meetsLanguageRequirement &&
                            userSubjectsMap.get(
                                "additional language subject"
                            ) === subjectName &&
                            userSubjectsMap.get("additional language") >=
                                requiredPercent;
                    }
                }
            }

            // ...existing code...

            const finalDecision =
                aps >= requiredAPS &&
                meetsMath &&
                meetsOther &&
                meetsGroups &&
                meetsLanguageRequirement;

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
