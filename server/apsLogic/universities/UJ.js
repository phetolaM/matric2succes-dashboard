export const meta = {
    code: "uj",
    displayName: "University of Johannesburg",
    collections: ["uj"],
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

    // Build a list of academic subject entries (exclude Life Orientation)
    // We'll tag entries so we can force-include languages and math into the top-6
    const entries = [];

    // Home Language (always include if present)
    const homeLangPercent = Number(data.homeLanguagePercent || 0);
    if (homeLangPercent > 0) {
        entries.push({
            name: "home language",
            percent: homeLangPercent,
            tag: "homeLang",
        });
    }

    // Additional Language (include if present)
    const addLangPercent = Number(data.additionalLanguagePercent || 0);
    if (addLangPercent > 0) {
        entries.push({
            name: "additional language",
            percent: addLangPercent,
            tag: "addLang",
        });
    }

    // Mathematics (choose best of the three math types, count only once)
    const mathCandidates = [
        { name: "mathematics", percent: Number(data.mathPercent || 0) },
        {
            name: "technical mathematics",
            percent: Number(data.technicalMathPercent || 0),
        },
        {
            name: "mathematical literacy",
            percent: Number(data.mathLitPercent || 0),
        },
    ];
    const bestMath = mathCandidates.reduce(
        (best, s) => (s.percent > (best.percent || 0) ? s : best),
        { percent: 0 }
    );
    if (bestMath.percent > 0) {
        entries.push({
            name: bestMath.name,
            percent: bestMath.percent,
            tag: "math",
        });
    }

    // Other subjects (exclude LO). Use provided subject names when available.
    (data.otherSubjects || []).forEach((subject) => {
        if (!subject || !subject.subject) return;
        if (/life orientation/i.test(subject.subject)) return;
        entries.push({
            name: (subject.subject || "").toLowerCase(),
            percent: Number(subject.percent || 0),
            tag: "other",
        });
    });

    // Now select the 6 subjects: ensure home language and a math subject are included (and additional language if present).
    // Sort descending by percent
    let sorted = entries.slice().sort((a, b) => b.percent - a.percent);

    // Take top 6 initially
    let top = sorted.slice(0, 6);

    // Helper to check presence by tag
    const hasTag = (tag) => top.some((e) => e.tag === tag);

    // Force-include home language and math and additional language (if they exist) by replacing lowest 'other' entries
    const requiredTags = [];
    if (homeLangPercent > 0) requiredTags.push("homeLang");
    if (addLangPercent > 0) requiredTags.push("addLang");
    if (bestMath.percent > 0) requiredTags.push("math");

    for (const tag of requiredTags) {
        if (!hasTag(tag)) {
            // Find the required entry in the full sorted list
            const requiredEntry = sorted.find((e) => e.tag === tag);
            if (requiredEntry) {
                // Replace the lowest-ranked non-required entry in top (prefer 'other')
                let replaceIdx = -1;
                for (let i = top.length - 1; i >= 0; i--) {
                    if (!requiredTags.includes(top[i].tag)) {
                        replaceIdx = i;
                        break;
                    }
                }
                if (replaceIdx === -1 && top.length < 6) {
                    // No need to replace, just push if less than 6
                    top.push(requiredEntry);
                } else if (replaceIdx !== -1) {
                    top[replaceIdx] = requiredEntry;
                }
                // Re-sort top by percent after replacement
                top = top.sort((a, b) => b.percent - a.percent);
            }
        }
    }

    // If fewer than 6 entries exist, that's acceptable; APS will be computed from available academic subjects
    const totalAPS = top.reduce((sum, e) => sum + percentToAps(e.percent), 0);
    // console.log(`UJ Aps Score:  ${totalAPS}`);
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
            // console.log(
            //     "\n====== Evaluating course:",
            //     course.courseName,
            //     "======"
            // );

            // console.log("APS Requirement (General):", course.apsRequirement);
            // console.log(
            //     "APS Requirement (Math):",
            //     course.apsRequirementMathematics
            // );
            // console.log(
            //     "APS Requirement (Math Lit):",
            //     course.apsRequirementMathLit
            // );
            // console.log(
            //     "APS Requirement (Tech Math):",
            //     course.apsRequirementTechnicalMath
            // );

            // console.log("User Math APS:", userSubjectsMap.get("mathematics"));
            // console.log(
            //     "User Math Lit APS:",
            //     userSubjectsMap.get("mathematical literacy")
            // );
            // console.log(
            //     "User Tech Math APS:",
            //     userSubjectsMap.get("technical mathematics")
            // );

            const hasMath = userSubjectsMap.get("mathematics") > 0;
            const hasTechMath =
                userSubjectsMap.get("technical mathematics") > 0;
            const hasMathLit = userSubjectsMap.get("mathematical literacy") > 0;

            // Determine which math type the user has
            let userMathType = null;
            if (hasMath) userMathType = "mathematics";
            else if (hasTechMath) userMathType = "technical mathematics";
            else if (hasMathLit) userMathType = "mathematical literacy";

            // console.log("User's Math Type:", userMathType || "None");

            // Determine required APS based on user's math type
            let requiredAPS = null;
            let hasGeneralAPS =
                course.apsRequirement && course.apsRequirement > 0;
            let hasMathSpecificAPS =
                (course.apsRequirementMathematics &&
                    course.apsRequirementMathematics > 0) ||
                (course.apsRequirementMathLit &&
                    course.apsRequirementMathLit > 0) ||
                (course.apsRequirementTechnicalMath &&
                    course.apsRequirementTechnicalMath > 0);

            if (hasMathSpecificAPS) {
                // Math-specific APS requirements exist
                // User MUST have one of the specified math types
                if (
                    userMathType === "mathematics" &&
                    course.apsRequirementMathematics
                ) {
                    requiredAPS = Number(course.apsRequirementMathematics);
                    // console.log(`Using Math-specific APS: ${requiredAPS}`);
                } else if (
                    userMathType === "technical mathematics" &&
                    course.apsRequirementTechnicalMath
                ) {
                    requiredAPS = Number(course.apsRequirementTechnicalMath);
                    // console.log(
                    //     `Using Technical Math-specific APS: ${requiredAPS}`
                    // );
                } else if (
                    userMathType === "mathematical literacy" &&
                    course.apsRequirementMathLit
                ) {
                    requiredAPS = Number(course.apsRequirementMathLit);
                    // console.log(`Using Math Lit-specific APS: ${requiredAPS}`);
                } else {
                    // User's math type doesn't have a specific APS requirement
                    // This means they don't qualify for this course
                    // console.log(
                    //     `❌ User has ${userMathType}, but this course doesn't accept that math type (only specific types with APS defined)`
                    // );
                    requiredAPS = 9999; // Set impossibly high APS to disqualify
                }
            } else if (hasGeneralAPS) {
                // Only general APS exists - accept any math type
                requiredAPS = Number(course.apsRequirement);
                // console.log(
                //     `Using General APS: ${requiredAPS} (accepts any math type)`
                // );
            } else {
                // No APS requirement at all
                requiredAPS = 0;
                // console.log("No APS requirement for this course");
            }

            // console.log("User APS:", aps, "| Required APS:", requiredAPS);

            // --- Flexible Language Requirements ---
            // Check if user meets ALL required languages
            let meetsLanguageRequirements = true;
            if (
                course.languageRequirements &&
                course.languageRequirements.length > 0
            ) {
                // console.log("Checking flexible language requirements...");

                for (const langReq of course.languageRequirements) {
                    const requiredLanguageName = idToName
                        .get(langReq.subjectId)
                        ?.toLowerCase();
                    if (!requiredLanguageName) continue;

                    // console.log(`Required Language: ${requiredLanguageName}`);

                    const userHomeLanguage = userSubjectsMap.get(
                        "home language subject"
                    );
                    const userHomeLanguagePercent =
                        userSubjectsMap.get("home language") || 0;
                    const userAdditionalLanguage = userSubjectsMap.get(
                        "additional language subject"
                    );
                    const userAdditionalLanguagePercent =
                        userSubjectsMap.get("additional language") || 0;

                    // console.log(
                    //     `User Home Language: ${userHomeLanguage} (${userHomeLanguagePercent}%)`
                    // );
                    // console.log(
                    //     `User Additional Language: ${userAdditionalLanguage} (${userAdditionalLanguagePercent}%)`
                    // );

                    let meetsThisLanguage = false;

                    // Check if user took this language as home language
                    if (
                        userHomeLanguage === requiredLanguageName &&
                        langReq.homeLanguagePercentage
                    ) {
                        const requiredPercent = Number(
                            langReq.homeLanguagePercentage
                        );
                        if (userHomeLanguagePercent >= requiredPercent) {
                            // console.log(
                            //     `✅ Meets ${requiredLanguageName} as Home Language (${userHomeLanguagePercent}% >= ${requiredPercent}%)`
                            // );
                            meetsThisLanguage = true;
                        } else {
                            // console.log(
                            //     `❌ Does NOT meet ${requiredLanguageName} as Home Language (${userHomeLanguagePercent}% < ${requiredPercent}%)`
                            // );
                        }
                    }

                    // Check if user took this language as additional language
                    if (
                        !meetsThisLanguage &&
                        userAdditionalLanguage === requiredLanguageName &&
                        langReq.additionalLanguagePercentage
                    ) {
                        const requiredPercent = Number(
                            langReq.additionalLanguagePercentage
                        );
                        if (userAdditionalLanguagePercent >= requiredPercent) {
                            // console.log(
                            //     `✅ Meets ${requiredLanguageName} as Additional Language (${userAdditionalLanguagePercent}% >= ${requiredPercent}%)`
                            // );
                            meetsThisLanguage = true;
                        } else {
                            // console.log(
                            //     `❌ Does NOT meet ${requiredLanguageName} as Additional Language (${userAdditionalLanguagePercent}% < ${requiredPercent}%)`
                            // );
                        }
                    }

                    // If neither home nor additional language requirement is met, fail
                    if (!meetsThisLanguage) {
                        // console.log(
                        //     `❌ User does not meet requirement for ${requiredLanguageName}`
                        // );
                        meetsLanguageRequirements = false;
                        break;
                    }
                }
            }

            // --- Check Not Applicable Subjects ---
            // If user has taken any subject that's not applicable, they are disqualified
            let hasNotApplicableSubject = false;
            if (
                course.notApplicableSubjects &&
                course.notApplicableSubjects.length > 0
            ) {
                // console.log("Checking for not applicable subjects...");
                for (const notApplicableSubId of course.notApplicableSubjects) {
                    const notApplicableSubjectName = idToName
                        .get(notApplicableSubId)
                        ?.toLowerCase();
                    if (!notApplicableSubjectName) continue;

                    // Check if user has this subject (with any percentage)
                    if (userSubjectsMap.has(notApplicableSubjectName)) {
                        // console.log(
                        //     `❌ DISQUALIFIED: User took ${notApplicableSubjectName} which is NOT APPLICABLE for this course`
                        // );
                        hasNotApplicableSubject = true;
                        break;
                    }
                }
            }

            const mathReqs = course.subjectRequirements?.filter((req) =>
                mathSubjects.includes(req.subjectId)
            );
            const otherReqs = course.subjectRequirements?.filter(
                (req) => !mathSubjects.includes(req.subjectId)
            );

            // Check math requirements (OR logic - user needs to meet at least one)
            // IMPORTANT: Match the math requirement with user's math type
            const meetsMath =
                !mathReqs?.length ||
                mathReqs.some((req) => {
                    const subject = idToName.get(req.subjectId)?.toLowerCase();
                    const userPercent = userSubjectsMap.get(subject) || 0;
                    const meetsRequirement = userPercent >= req.percentage;

                    // console.log(
                    //     `[Math Check] Required: ${subject} >= ${req.percentage}% | User has: ${userPercent}% | Meets: ${meetsRequirement}`
                    // );

                    // User must have this specific math type AND meet the percentage
                    return meetsRequirement;
                });

            // console.log("Meets Math Requirements:", meetsMath);

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

            // --- Final decision includes flexible language checks and not applicable subjects ---
            const finalDecision =
                !hasNotApplicableSubject &&
                aps >= requiredAPS &&
                meetsMath &&
                meetsOther &&
                meetsGroups &&
                meetsLanguageRequirements;

            // console.log("\n=== FINAL QUALIFICATION CHECK ===");
            // console.log(
            //     "APS Check:",
            //     aps >= requiredAPS,
            //     `(${aps} >= ${requiredAPS})`
            // );
            // console.log("Meets Math:", meetsMath);
            // console.log("Meets Other:", meetsOther);
            // console.log("Meets Subject Groups:", meetsGroups);
            // console.log(
            //     "Meets Language Requirements:",
            //     meetsLanguageRequirements
            // );
            // console.log("Has Not Applicable Subject:", hasNotApplicableSubject);
            // console.log("=================================");

            // console.log(
            //     ">>> Final Decision:",
            //     finalDecision ? "QUALIFIES ✅" : "Does NOT Qualify ❌"
            // );

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
            languageRequirements:
                course.languageRequirements?.map((req) => ({
                    subject: idToName.get(req.subjectId) || "Unknown Subject",
                    homeLanguagePercentage: req.homeLanguagePercentage,
                    additionalLanguagePercentage:
                        req.additionalLanguagePercentage,
                })) || [],
            notApplicableSubjects:
                course.notApplicableSubjects?.map(
                    (subId) => idToName.get(subId) || "Unknown Subject"
                ) || [],
        }));
}
