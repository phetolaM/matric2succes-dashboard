export const meta = {
    code: "uwc",
    displayName: "University of Western cape",
    collections: ["uwc"],
    mathSubjects: [
        "682320f89c61006b5937180c", // Mathematics
        "682346d7af0e046517c46da6", // Mathematical Literacy
        "68234b52af0e046517c46df4", // Technical Mathematics
    ],
};

export function calculateAPS(data) {
    // Points tables
    function englishPoints(percent) {
        if (percent >= 90) return 15;
        if (percent >= 80) return 13;
        if (percent >= 70) return 11;
        if (percent >= 60) return 9;
        if (percent >= 50) return 7;
        if (percent >= 40) return 5;
        if (percent >= 30) return 3;
        if (percent >= 20) return 1;
        return 0;
    }
    function mathPoints(percent) {
        if (percent >= 90) return 15;
        if (percent >= 80) return 13;
        if (percent >= 70) return 11;
        if (percent >= 60) return 9;
        if (percent >= 50) return 7;
        if (percent >= 40) return 5;
        if (percent >= 30) return 3;
        if (percent >= 20) return 1;
        return 0;
    }
    function loPoints(percent) {
        if (percent >= 40) return 3;
        if (percent >= 30) return 2;
        if (percent >= 20) return 1;
        return 0;
    }
    function otherPoints(percent) {
        if (percent >= 90) return 8;
        if (percent >= 80) return 7;
        if (percent >= 70) return 6;
        if (percent >= 60) return 5;
        if (percent >= 50) return 4;
        if (percent >= 40) return 3;
        if (percent >= 30) return 2;
        if (percent >= 20) return 1;
        return 0;
    }

    // English (Home or Additional)
    let englishPercent = 0;
    if (data.homeLanguage && /english/i.test(data.homeLanguage)) {
        englishPercent = Number(data.homeLanguagePercent || 0);
    } else if (
        data.additionalLanguage &&
        /english/i.test(data.additionalLanguage)
    ) {
        englishPercent = Number(data.additionalLanguagePercent || 0);
    }
    let aps = englishPoints(englishPercent);

    // Maths (best of Math, Math Lit, Technical Math)
    const mathPercents = [
        Number(data.mathPercent || 0),
        Number(data.mathLitPercent || 0),
    ];
    const bestMath = Math.max(...mathPercents);
    aps += mathPoints(bestMath);

    // Life Orientation
    if (typeof data.lifeOrientationPercent === "number") {
        aps += loPoints(data.lifeOrientationPercent);
    }

    // Other subjects (excluding English, Maths, LO)
    let otherPercents = [];

    // Home Language
    if (
        data.homeLanguage &&
        !/english/i.test(data.homeLanguage) &&
        !/life orientation/i.test(data.homeLanguage)
    ) {
        otherPercents.push(Number(data.homeLanguagePercent || 0));
    }
    // Additional Language
    if (
        data.additionalLanguage &&
        !/english/i.test(data.additionalLanguage) &&
        !/life orientation/i.test(data.additionalLanguage)
    ) {
        otherPercents.push(Number(data.additionalLanguagePercent || 0));
    }
    // Other Subjects
    (data.otherSubjects || []).forEach((subject) => {
        if (
            subject.subject &&
            !/english/i.test(subject.subject) &&
            !/mathematics$/i.test(subject.subject) && // Exclude "Mathematics" only
            !/mathematical literacy/i.test(subject.subject) &&
            !/life orientation/i.test(subject.subject)
        ) {
            otherPercents.push(Number(subject.percent || 0));
        }
    });

    // Also add Technical Mathematics if present
    if (
        data.technicalMathSubject &&
        !/life orientation/i.test(data.technicalMathSubject)
    ) {
        otherPercents.push(Number(data.technicalMathPercent || 0));
    }

    // Take the best 4 other subjects (so total is English + Maths + LO + 4 others = 7)
    otherPercents = otherPercents.sort((a, b) => b - a).slice(0, 4);
    aps += otherPercents.reduce(
        (sum, percent) => sum + otherPoints(percent),
        0
    );

    console.log(`UWC APS Score:  ${aps}`);
    return { aps };
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

            // --- Home & Additional Language Requirement (smart match for same subject) ---
            let meetsHomeLanguage = true;
            let meetsAdditionalLanguage = true;

            const requiredHome = course.homeLanguageRequirement;
            const requiredAdd = course.additionalLanguageRequirement;

            const requiredHomeSubject = requiredHome?.subjectId
                ? idToName.get(requiredHome.subjectId)?.toLowerCase()
                : null;
            const requiredAddSubject = requiredAdd?.subjectId
                ? idToName.get(requiredAdd.subjectId)?.toLowerCase()
                : null;

            const userHomeLang = (
                userSubjectsMap.get("home language subject") || ""
            ).toLowerCase();
            const userHomeLangPercent = userSubjectsMap.get("home language");
            const userAddLang = (
                userSubjectsMap.get("additional language subject") || ""
            ).toLowerCase();
            const userAddLangPercent = userSubjectsMap.get(
                "additional language"
            );

            // If both requirements are for the same subject (e.g. English)
            if (
                requiredHomeSubject &&
                requiredAddSubject &&
                requiredHomeSubject === requiredAddSubject
            ) {
                if (userHomeLang === requiredHomeSubject) {
                    meetsHomeLanguage =
                        userHomeLangPercent >= Number(requiredHome.percentage);
                    meetsAdditionalLanguage = true; // Not required if user doesn't have it as Additional
                } else if (userAddLang === requiredAddSubject) {
                    meetsHomeLanguage = true; // Not required if user doesn't have it as Home
                    meetsAdditionalLanguage =
                        userAddLangPercent >= Number(requiredAdd.percentage);
                } else {
                    meetsHomeLanguage = false;
                    meetsAdditionalLanguage = false;
                }
            } else {
                // --- Home Language Requirement ---
                meetsHomeLanguage = true;
                if (
                    course.homeLanguageRequirement &&
                    course.homeLanguageRequirement.percentage
                ) {
                    const required = course.homeLanguageRequirement;
                    const requiredPercent = Number(required.percentage);
                    if (required.subjectId === "all") {
                        meetsHomeLanguage =
                            typeof userSubjectsMap.get("home language") ===
                                "number" &&
                            userSubjectsMap.get("home language") >=
                                requiredPercent;
                    } else if (required.subjectId) {
                        const subjectName = idToName
                            .get(required.subjectId)
                            ?.toLowerCase();
                        meetsHomeLanguage =
                            userSubjectsMap.get("home language subject") ===
                                subjectName &&
                            userSubjectsMap.get("home language") >=
                                requiredPercent;
                    }
                }

                // --- Additional Language Requirement ---
                meetsAdditionalLanguage = true;
                if (
                    course.additionalLanguageRequirement &&
                    course.additionalLanguageRequirement.percentage
                ) {
                    const required = course.additionalLanguageRequirement;
                    const requiredPercent = Number(required.percentage);
                    if (required.subjectId === "all") {
                        meetsAdditionalLanguage =
                            typeof userSubjectsMap.get(
                                "additional language"
                            ) === "number" &&
                            userSubjectsMap.get("additional language") >=
                                requiredPercent;
                    } else if (required.subjectId) {
                        const subjectName = idToName
                            .get(required.subjectId)
                            ?.toLowerCase();
                        meetsAdditionalLanguage =
                            userSubjectsMap.get(
                                "additional language subject"
                            ) === subjectName &&
                            userSubjectsMap.get("additional language") >=
                                requiredPercent;
                    }
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
