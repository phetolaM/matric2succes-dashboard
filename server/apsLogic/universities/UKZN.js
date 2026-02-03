export const meta = {
    code: "ukzn",
    displayName: "University of Kwazulu-Natal",
    collections: ["ukzn"],
    mathSubjects: [
        "682320f89c61006b5937180c", // Mathematics
        "682346d7af0e046517c46da6", // Mathematical Literacy
        "68234b52af0e046517c46df4", // Technical Mathematics
    ],
};

export function calculateAPS(data) {
    // UKZN APS scale
    function percentToAps(percent) {
    
        if (percent >= 80) return 7;
        if (percent >= 70) return 6;
        if (percent >= 60) return 5;
        if (percent >= 50) return 4;
        if (percent >= 40) return 3;
        if (percent >= 30) return 2;
        return 1;
    }

    // 1. English (HL or FAL)
    let englishPercent = 0;
    if (data.homeLanguage && /english/i.test(data.homeLanguage)) {
        englishPercent = Number(data.homeLanguagePercent || 0);
    } else if (
        data.additionalLanguage &&
        /english/i.test(data.additionalLanguage)
    ) {
        englishPercent = Number(data.additionalLanguagePercent || 0);
    }

    // 2. Mathematics or Mathematical Literacy (best)
    const mathPercents = [
        Number(data.mathPercent || 0),
        Number(data.mathLitPercent || 0),
    ];
    const bestMathPercent = Math.max(...mathPercents);

    // 3. Other subjects (excluding Life Orientation, Maths Paper 3, English, and Maths/Math Lit already counted)
    let otherSubjects = (data.otherSubjects || []).filter(
        (subject) =>
            subject.subject &&
            !/life orientation/i.test(subject.subject) &&
            !/paper ?3/i.test(subject.subject) &&
            !/english/i.test(subject.subject) &&
            !/mathematics/i.test(subject.subject)
    );

    // Remove duplicates if any (by subject name)
    const usedSubjects = new Set();
    otherSubjects = otherSubjects.filter((subj) => {
        const name = subj.subject.toLowerCase();
        if (usedSubjects.has(name)) return false;
        usedSubjects.add(name);
        return true;
    });

    // Sort by percent descending and take best 4
    const bestOtherPercents = otherSubjects
        .map((s) => Number(s.percent || 0))
        .sort((a, b) => b - a)
        .slice(0, 4);

    // 4. Calculate APS
    let totalAPS = 0;
    totalAPS += percentToAps(englishPercent);
    totalAPS += percentToAps(bestMathPercent);
    bestOtherPercents.forEach((percent) => {
        totalAPS += percentToAps(percent);
    });

    console.log(`UKZN APS Score: ${totalAPS}`);
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

            console.log("=== Home/Additional Language Debug ===");
            console.log(
                "Required Home Subject:",
                requiredHomeSubject,
                "| Required %:",
                requiredHome?.percentage
            );
            console.log(
                "Required Add Subject:",
                requiredAddSubject,
                "| Required %:",
                requiredAdd?.percentage
            );
            console.log(
                "User Home Language:",
                userHomeLang,
                "| User Home %:",
                userHomeLangPercent
            );
            console.log(
                "User Additional Language:",
                userAddLang,
                "| User Add %:",
                userAddLangPercent
            );

            // If both requirements are for the same subject (e.g. English, Zulu, etc.)
            if (
                requiredHomeSubject &&
                requiredAddSubject &&
                requiredHomeSubject === requiredAddSubject
            ) {
                // User must have that subject as either Home or Additional Language
                if (userHomeLang === requiredHomeSubject) {
                    meetsHomeLanguage =
                        userHomeLangPercent >= Number(requiredHome.percentage);
                    meetsAdditionalLanguage = true; // Not required if user doesn't have it as Additional
                    console.log(
                        "User has required subject as Home Language. Meets Home:",
                        meetsHomeLanguage
                    );
                } else if (userAddLang === requiredAddSubject) {
                    meetsHomeLanguage = true; // Not required if user doesn't have it as Home
                    meetsAdditionalLanguage =
                        userAddLangPercent >= Number(requiredAdd.percentage);
                    console.log(
                        "User has required subject as Additional Language. Meets Additional:",
                        meetsAdditionalLanguage
                    );
                } else {
                    meetsHomeLanguage = false;
                    meetsAdditionalLanguage = false;
                    console.log(
                        "User does not have required subject as Home or Additional Language."
                    );
                }
            } else {
                // Standard logic for different subjects or "all"
                if (requiredHome && requiredHome.percentage) {
                    if (requiredHome.subjectId === "all") {
                        meetsHomeLanguage =
                            typeof userHomeLangPercent === "number" &&
                            userHomeLangPercent >=
                                Number(requiredHome.percentage);
                        console.log(
                            "Checking Home Language (all):",
                            meetsHomeLanguage
                        );
                    } else if (userHomeLang === requiredHomeSubject) {
                        meetsHomeLanguage =
                            userHomeLangPercent >=
                            Number(requiredHome.percentage);
                        console.log(
                            "Checking Home Language (specific):",
                            meetsHomeLanguage
                        );
                    } else {
                        meetsHomeLanguage = false;
                        console.log(
                            "User does not have required subject as Home Language (specific)."
                        );
                    }
                }
                if (requiredAdd && requiredAdd.percentage) {
                    if (requiredAdd.subjectId === "all") {
                        meetsAdditionalLanguage =
                            typeof userAddLangPercent === "number" &&
                            userAddLangPercent >=
                                Number(requiredAdd.percentage);
                        console.log(
                            "Checking Additional Language (all):",
                            meetsAdditionalLanguage
                        );
                    } else if (userAddLang === requiredAddSubject) {
                        meetsAdditionalLanguage =
                            userAddLangPercent >=
                            Number(requiredAdd.percentage);
                        console.log(
                            "Checking Additional Language (specific):",
                            meetsAdditionalLanguage
                        );
                    } else {
                        meetsAdditionalLanguage = false;
                        console.log(
                            "User does not have required subject as Additional Language (specific)."
                        );
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
                    console.log(
                        "[Other Check] Required subject:",
                        subject,
                        "| Required %:",
                        req.percentage,
                        "| User %:",
                        userPercent,
                        "| User has subject:",
                        userSubjectsMap.has(subject)
                    );
                    return userPercent >= Number(req.percentage);
                });

            const meetsGroups =
                !course.subjectRequirementGroups?.length ||
                course.subjectRequirementGroups.every((group) => {
                    return group.some((req) => {
                        const subject = idToName
                            .get(req.subjectId)
                            ?.toLowerCase();
                        const userPercent = userSubjectsMap.get(subject) || 0;
                        return userPercent >= Number(req.percentage); // Ensure numeric comparison
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
