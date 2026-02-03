export const meta = {
    code: "unisa",
    displayName: "University of South Africa",
    collections: ["unisa"],
    mathSubjects: [
        "682320f89c61006b5937180c", // Mathematics
        "682346d7af0e046517c46da6", // Mathematical Literacy
        "68234b52af0e046517c46df4", // Technical Mathematics
    ],
};

// General (level) requirements for UNISA admissions
export const generalLevelRequirements = {
    "higher certificate": {
        homeLanguageMin: 40,
        otherSubjectsMin40Count: 2, // at least two other subjects >=40%
        otherSubjectsMin30Count: 4, // at least four other subjects >=30%
    },
    diploma: {
        homeLanguageMin: 40,
        otherSubjectsMin40Count: 3, // three other subjects >=40% (excluding Life Orientation)
        additionalLanguageMin: 30, // additional language at least 30%
    },
    bachelor: {
        homeLanguageMin: 40, // compulsory
        otherSubjectsMin50Count: 4, // four other subjects >=50% (excluding Life Orientation)
        additionalLanguageMin: 30,
        lifeOrientationMin: 30,
    },
};

// Determine highest general qualification level a user meets based on their subject percentages
export function evaluateUserGeneralLevel(userSubjectsMap = new Map()) {
    // helper to get percent by normalized key
    const get = (key) => {
        const v = userSubjectsMap.get(key);
        return typeof v === "number" ? v : Number(v || 0);
    };

    const homeLang = get("home language");
    const additionalLang = get("additional language");
    const lifeOrientation = get("life orientation");

    // build list of other subject percentages (exclude home/additional language and life orientation)
    const otherPercents = [];
    for (const [k, v] of userSubjectsMap.entries()) {
        const key = (k || "").toString().toLowerCase();
        if (!key) continue;
        if (
            key === "home language" ||
            key === "additional language" ||
            key === "life orientation"
        )
            continue;
        const num = Number(v || 0);
        if (!isNaN(num)) otherPercents.push(num);
    }

    // counts
    const countAtLeast = (threshold) =>
        otherPercents.filter((p) => p >= threshold).length;

    // Check bachelor first (highest)
    const bachelorReq = generalLevelRequirements["bachelor"];
    if (
        homeLang >= bachelorReq.homeLanguageMin &&
        countAtLeast(50) >= bachelorReq.otherSubjectsMin50Count &&
        additionalLang >= bachelorReq.additionalLanguageMin &&
        lifeOrientation >= bachelorReq.lifeOrientationMin
    ) {
        return "bachelor";
    }

    // Check diploma
    const diplomaReq = generalLevelRequirements["diploma"];
    if (
        homeLang >= diplomaReq.homeLanguageMin &&
        countAtLeast(40) >= diplomaReq.otherSubjectsMin40Count &&
        additionalLang >= (diplomaReq.additionalLanguageMin || 0)
    ) {
        return "diploma";
    }

    // Check higher certificate
    const hcReq = generalLevelRequirements["higher certificate"];
    if (
        homeLang >= hcReq.homeLanguageMin &&
        countAtLeast(40) >= hcReq.otherSubjectsMin40Count &&
        countAtLeast(30) >= hcReq.otherSubjectsMin30Count
    ) {
        return "higher certificate";
    }

    return null;
}

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

    // Collect all subjects except Life Orientation
    let allSubjects = [];

    // Home Language (English or other)
    if (data.homeLanguage && !/life orientation/i.test(data.homeLanguage)) {
        allSubjects.push({
            name: data.homeLanguage,
            percent: Number(data.homeLanguagePercent || 0),
        });
    }

    // Additional Language
    if (
        data.additionalLanguage &&
        !/life orientation/i.test(data.additionalLanguage)
    ) {
        allSubjects.push({
            name: data.additionalLanguage,
            percent: Number(data.additionalLanguagePercent || 0),
        });
    }

    // Best Mathematics (Math, Math Lit, Technical Math)
    const mathSubjects = [
        { name: "mathematics", percent: data.mathPercent },
        { name: "technical mathematics", percent: data.technicalMathPercent },
        { name: "mathematical literacy", percent: data.mathLitPercent },
    ];
    const bestMath = mathSubjects
        .filter((s) => s.percent && !/life orientation/i.test(s.name))
        .sort((a, b) => (b.percent || 0) - (a.percent || 0))[0];
    if (bestMath && bestMath.percent > 0) {
        allSubjects.push({
            name: bestMath.name,
            percent: Number(bestMath.percent),
        });
    }

    // Other Subjects (excluding LO, Home, Additional, Math)
    let otherSubjects = (data.otherSubjects || [])
        .filter(
            (s) =>
                s.subject &&
                !/life orientation/i.test(s.subject) &&
                !/mathematics/i.test(s.subject.toLowerCase()) &&
                // Exclude only mathematical literacy variants (avoid excluding unrelated "literacy" subjects)
                !(
                    /mathematical literacy/i.test(s.subject.toLowerCase()) ||
                    /math lit/i.test(s.subject.toLowerCase())
                ) &&
                !/technical mathematics/i.test(s.subject.toLowerCase()) &&
                s.subject.toLowerCase() !==
                    (data.homeLanguage || "").toLowerCase() &&
                s.subject.toLowerCase() !==
                    (data.additionalLanguage || "").toLowerCase()
        )
        .map((s) => ({
            name: s.subject,
            percent: Number(s.percent || 0),
        }));

    allSubjects = [...allSubjects, ...otherSubjects];

    // Exclude Life Orientation and any subject with <30%
    allSubjects = allSubjects.filter((s) => s.percent >= 30);

    // Find English subject (Home or Additional)
    let englishSubject = allSubjects.find((s) => /english/i.test(s.name));
    if (!englishSubject) {
        // If no English, take Home Language as fallback
        englishSubject = allSubjects.find((s) => s.name === data.homeLanguage);
    }

    // Remove English from the list for "best 5 others"
    let otherForBest = allSubjects.filter((s) => s !== englishSubject);

    // Take best 5 other subjects
    otherForBest = otherForBest
        .sort((a, b) => b.percent - a.percent)
        .slice(0, 5);

    // Calculate APS: English + best 5 others
    let totalAPS = 0;
    if (englishSubject) {
        totalAPS += percentToAps(englishSubject.percent);
    }
    totalAPS += otherForBest.reduce(
        (sum, s) => sum + percentToAps(s.percent),
        0
    );

    console.log(`UNISA APS Score:  ${totalAPS}`);
    return { aps: totalAPS };
}

export function getQualifiedCourses({
    aps,
    userSubjectsMap,
    courses,
    idToName,
    mathSubjects = meta.mathSubjects,
}) {
    // Determine user's general qualification level once
    const userGeneralLevel = evaluateUserGeneralLevel(userSubjectsMap);
    const levelRank = { "higher certificate": 1, diploma: 2, bachelor: 3 };

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

            // --- General level requirement check ---
            if (course.level) {
                const courseLevel = (course.level || "")
                    .toString()
                    .toLowerCase();
                const reqRank = levelRank[courseLevel] || 0;
                const userRank = levelRank[userGeneralLevel] || 0;
                console.log(
                    "Course level:",
                    courseLevel,
                    "Required rank:",
                    reqRank,
                    "User general rank:",
                    userRank
                );
                // If user does not meet the general level required for the course, disqualify
                if (userRank < reqRank) {
                    console.log(
                        `User does not meet general level requirement: needs ${courseLevel}, user: ${userGeneralLevel}`
                    );
                    return false;
                }
            }

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

            // --- UNISA-specific: optional requirement for "four further content subjects >=60%"
            // If a course has `fourContentAtLeast60: true`, require that the user has at least
            // four additional content subjects (excluding those already required for the course,
            // and excluding home/additional language and life orientation) each with >= 60%.
            let meetsUnisaFour60 = true;
            if (course.fourContentAtLeast60) {
                // Build a set of excluded subject names (normalized)
                const normalize = (s) =>
                    (s || "").toString().toLowerCase().trim();
                const excluded = new Set();
                // exclude explicitly required subjectIds (both mathReqs and otherReqs)
                (mathReqs || []).forEach((r) => {
                    const raw = idToName.get(r.subjectId);
                    const name = normalize(raw);
                    if (name) excluded.add(name);
                });
                (otherReqs || []).forEach((r) => {
                    const raw = idToName.get(r.subjectId);
                    const name = normalize(raw);
                    if (name) excluded.add(name);
                });

                // exclude language keys and life orientation by name
                const homeLangName = userSubjectsMap.get(
                    "home language subject"
                );
                const addLangName = userSubjectsMap.get(
                    "additional language subject"
                );
                if (homeLangName) excluded.add(normalize(String(homeLangName)));
                if (addLangName) excluded.add(normalize(String(addLangName)));
                excluded.add("life orientation");

                // Count content subjects from user's subject map meeting >=60%, excluding excluded set
                let countContent60 = 0;
                for (const [key, val] of userSubjectsMap.entries()) {
                    // Skip the special keys that store subject names (they are suffixed with 'subject')
                    const keyStr = (key || "").toString();
                    if (keyStr.toLowerCase().includes("subject")) continue;
                    const subjName = normalize(keyStr);
                    const percent = Number(val || 0);
                    if (!subjName) continue;
                    // skip languages and life orientation and any explicitly excluded names
                    if (
                        subjName === "home language" ||
                        subjName === "additional language" ||
                        subjName === "life orientation"
                    )
                        continue;

                    // Exclude if subject matches any explicitly required subject name (robust match):
                    // either exact match, or one contains the other (to handle small naming differences)
                    let isExcluded = false;
                    for (const ex of excluded) {
                        if (!ex) continue;
                        if (subjName === ex) {
                            isExcluded = true;
                            break;
                        }
                        if (subjName.includes(ex) || ex.includes(subjName)) {
                            isExcluded = true;
                            break;
                        }
                    }
                    if (isExcluded) continue;

                    if (percent >= 60) countContent60 += 1;
                }

                meetsUnisaFour60 = countContent60 >= 4;
            }

            // --- Final decision includes new language checks ---
            const finalDecision =
                aps >= (course.apsRequirement || 0) &&
                meetsMath &&
                meetsOther &&
                meetsGroups &&
                meetsHomeLanguage &&
                meetsAdditionalLanguage &&
                meetsUnisaFour60;

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
