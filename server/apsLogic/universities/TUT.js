export const meta = {
    code: "tut",
    displayName: "Tshwane University of Technology",
    collections: ["tut"],
    mathSubjects: [
        "682320f89c61006b5937180c", // Mathematics
        "682346d7af0e046517c46da6", // Mathematical Literacy
        "68234b52af0e046517c46df4", // Technical Mathematics
    ],
};

export function calculateAPS(data) {
    let totalAPS = 0;

    function percentToAps(percent) {
        if (percent >= 80) return 7;
        if (percent >= 70) return 6;
        if (percent >= 60) return 5;
        if (percent >= 50) return 4;
        if (percent >= 40) return 3;
        if (percent >= 30) return 2;
        // 0-29% (level 1) is not counted at all
        return 0;
    }

    const isLifeOrientation = (name) =>
        typeof name === "string" && /life orientation/i.test(name);

    // Collect subject entries. Keep a display list (includes LO) but use a
    // separate calculation list that excludes Life Orientation and <30%.
    const entriesDisplay = [];
    const entriesCalc = [];

    const pushEntry = (name, percent, role) => {
        if (!name) return;
        const p = Number(percent) || 0;
        const lname = String(name).toLowerCase();

        // Always include in display list (so LO remains visible elsewhere)
        entriesDisplay.push({ name: lname, percent: p, role });

        // Only include in calculation list when >=30% and not Life Orientation
        if (p >= 30 && !isLifeOrientation(name)) {
            entriesCalc.push({
                name: lname,
                percent: p,
                aps: percentToAps(p),
                role,
            });
        }
        // If it's Life Orientation, we skip adding to entriesCalc so it won't
        // count toward APS nor consume one of the 6 selection slots.
    };

    // Home and Additional languages
    pushEntry(data.homeLanguage, data.homeLanguagePercent, "homeLanguage");
    pushEntry(
        data.additionalLanguage,
        data.additionalLanguagePercent,
        "additionalLanguage"
    );

    // Mathematics (choose the best math-type subject)
    const mathCandidates = [
        { percent: Number(data.mathPercent) || 0, name: data.mathSubject },
        {
            percent: Number(data.technicalMathPercent) || 0,
            name: data.technicalMathSubject,
        },
        {
            percent: Number(data.mathLitPercent) || 0,
            name: data.mathLitSubject,
        },
    ];
    const bestMathCandidate = mathCandidates
        .filter((s) => s.name && s.percent >= 30 && !isLifeOrientation(s.name))
        .sort((a, b) => b.percent - a.percent)[0];
    if (bestMathCandidate) {
        pushEntry(bestMathCandidate.name, bestMathCandidate.percent, "math");
    }

    // Other subjects
    (data.otherSubjects || []).forEach((subject) => {
        if (subject && subject.subject) {
            pushEntry(subject.subject, subject.percent, "other");
        }
    });

    // If after excluding LO there are more than 6 subjects, select best 6
    // but always include homeLanguage, additionalLanguage and math (if present), then fill remaining slots with highest APS others
    const uniqueByName = (arr) => {
        const seen = new Set();
        return arr.filter((e) => {
            if (seen.has(e.name)) return false;
            seen.add(e.name);
            return true;
        });
    };

    const uniqEntries = uniqueByName(entriesCalc);

    // Separate forced includes and others (calculation list only)
    const forced = uniqEntries.filter(
        (e) =>
            e.role === "homeLanguage" ||
            e.role === "additionalLanguage" ||
            e.role === "math"
    );
    const others = uniqEntries.filter((e) => !forced.includes(e));

    const selected = [];
    const selectedNames = new Set();

    // Add forced in priority order (home, additional, math) if present
    ["homeLanguage", "additionalLanguage", "math"].forEach((r) => {
        const item = forced.find((f) => f.role === r);
        if (item && !selectedNames.has(item.name)) {
            selected.push(item);
            selectedNames.add(item.name);
        }
    });

    // Fill remaining slots up to 6 with highest APS from others
    const sortedOthers = others.sort((a, b) => {
        if (b.aps !== a.aps) return b.aps - a.aps;
        return b.percent - a.percent;
    });
    for (let i = 0; i < sortedOthers.length && selected.length < 6; i++) {
        const it = sortedOthers[i];
        if (!selectedNames.has(it.name)) {
            selected.push(it);
            selectedNames.add(it.name);
        }
    }

    // Sum APS of selected subjects
    totalAPS = selected.reduce((sum, it) => sum + (Number(it.aps) || 0), 0);

    console.log(`TUT APS Score:  ${totalAPS}`);
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

            // Determine required APS taking into account flexible variants.
            // If multiple variants match the user's subjects, choose the lowest APS among them
            // (i.e., the most permissive requirement for the user).
            let requiredAPS = course.apsRequirement;
            if (
                Array.isArray(course.apsRequirementVariants) &&
                course.apsRequirementVariants.length
            ) {
                const matchedAps = [];
                for (const v of course.apsRequirementVariants) {
                    if (
                        !v ||
                        !Array.isArray(v.subjectIds) ||
                        !v.subjectIds.length
                    )
                        continue;
                    // Collect user's percents for the listed subjects (use idToName to map)
                    const percents = v.subjectIds
                        .map((sid) => idToName.get(sid)?.toLowerCase())
                        .map((name) =>
                            name ? userSubjectsMap.get(name) || 0 : 0
                        );

                    // Determine match: if matchAll is true, require ALL subjects to be present (>=30%),
                    // otherwise require ANY subject to be present (>=30%). We treat <30% as not counted.
                    const threshold = 30;
                    const matchAll = Boolean(v.matchAll);
                    const variantMatches = matchAll
                        ? percents.every((p) => p >= threshold)
                        : percents.some((p) => p >= threshold);

                    if (variantMatches) {
                        const vAps = Number(v.aps || 0);
                        if (!Number.isNaN(vAps) && vAps > 0)
                            matchedAps.push(vAps);
                    }
                }

                if (matchedAps.length) {
                    requiredAPS = Math.min(...matchedAps);
                } else {
                    // no variant matched; fall back to legacy math-specific fields
                    if (hasMath && course.apsRequirementMathematics) {
                        requiredAPS = course.apsRequirementMathematics;
                    } else if (
                        hasTechMath &&
                        course.apsRequirementTechnicalMath
                    ) {
                        requiredAPS = course.apsRequirementTechnicalMath;
                    } else if (hasMathLit && course.apsRequirementMathLit) {
                        requiredAPS = course.apsRequirementMathLit;
                    }
                }
            } else {
                // Backwards compatible checks for math-specific APS fields
                if (hasMath && course.apsRequirementMathematics) {
                    requiredAPS = course.apsRequirementMathematics;
                } else if (hasTechMath && course.apsRequirementTechnicalMath) {
                    requiredAPS = course.apsRequirementTechnicalMath;
                } else if (hasMathLit && course.apsRequirementMathLit) {
                    requiredAPS = course.apsRequirementMathLit;
                }
            }

            // console.log("User APS:", aps, "| Required APS:", requiredAPS);

            // --- Home Language Requirement ---
            // Behavior: If the course requires a home language level (either 'all' or a language selection),
            // we always evaluate against the user's declared home language percentage. This supports admin
            // UI choices like selecting any language (or a specific language) to mean "home language".
            let meetsHomeLanguage = true;
            if (
                course.homeLanguageRequirement &&
                course.homeLanguageRequirement.percentage !== undefined
            ) {
                const required = course.homeLanguageRequirement;
                const requiredPercent = Number(required.percentage);

                if (required.subjectId === "all") {
                    meetsHomeLanguage =
                        typeof userSubjectsMap.get("home language") ===
                            "number" &&
                        userSubjectsMap.get("home language") >= requiredPercent;
                } else if (required.subjectId) {
                    // If admin selected a specific language (or used the 'remaining language(s)' token),
                    // interpret that as a requirement on the user's home language value.
                    // Only pass if user provided a home language percentage.
                    meetsHomeLanguage =
                        typeof userSubjectsMap.get("home language") ===
                            "number" &&
                        userSubjectsMap.get("home language") >= requiredPercent;
                }
            }

            // --- Additional Language Requirement ---
            // Behavior: If the course requires an additional language level (either 'all' or 'remaining language(s)')
            // interpret that as a requirement on the user's declared additional language percentage.
            let meetsAdditionalLanguage = true;
            if (
                course.additionalLanguageRequirement &&
                course.additionalLanguageRequirement.percentage !== undefined
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
                    // If admin selected the 'remaining language(s)' option or a specific language,
                    // use the user's additional language percentage for the check.
                    meetsAdditionalLanguage =
                        typeof userSubjectsMap.get("additional language") ===
                            "number" &&
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

            // Helper: resolve a user's percent for a given subject name (language-aware)
            // Priority: explicit subject percent (if user listed the subject directly),
            // then home language percent if the subject matches user's home language,
            // then additional language percent if it matches user's additional language.
            const getUserPercentForSubject = (subjectName) => {
                if (!subjectName) return 0;
                const name = subjectName.toLowerCase();
                let p = Number(userSubjectsMap.get(name)) || 0;
                const homeSub = userSubjectsMap.get("home language subject");
                const addSub = userSubjectsMap.get(
                    "additional language subject"
                );
                const homePct =
                    Number(userSubjectsMap.get("home language")) || 0;
                const addPct =
                    Number(userSubjectsMap.get("additional language")) || 0;
                if (homeSub === name && homePct > p) p = homePct;
                if (addSub === name && addPct > p) p = addPct;
                // If the required subject is a language that matches the user's
                // declared home or additional language, consider those percentages
                // as valid values for the subject. This covers any language (not
                // just English/Afrikaans) because the user's selected home/add
                // language subject is recorded in the map (e.g. "english").
                try {
                    const homeSubNorm =
                        homeSub && String(homeSub).toLowerCase();
                    const addSubNorm = addSub && String(addSub).toLowerCase();
                    if (
                        (homeSubNorm && homeSubNorm === name) ||
                        (addSubNorm && addSubNorm === name)
                    ) {
                        if (homePct > p) p = homePct;
                        if (addPct > p) p = addPct;
                    }
                } catch (err) {
                    /* ignore normalization errors */
                }
                return p;
            };

            const meetsMath =
                !mathReqs?.length ||
                mathReqs.some((req) => {
                    const subject = idToName.get(req.subjectId)?.toLowerCase();
                    const userPercent = getUserPercentForSubject(subject) || 0;
                    return userPercent >= req.percentage;
                });

            const meetsOther =
                !otherReqs?.length ||
                otherReqs.every((req) => {
                    const subject = idToName.get(req.subjectId)?.toLowerCase();
                    const userPercent = getUserPercentForSubject(subject) || 0;
                    return userPercent >= req.percentage;
                });

            const meetsGroups =
                !course.subjectRequirementGroups?.length ||
                course.subjectRequirementGroups.every((group) => {
                    return group.some((req) => {
                        const subject = idToName
                            .get(req.subjectId)
                            ?.toLowerCase();
                        const userPercent =
                            getUserPercentForSubject(subject) || 0;
                        return userPercent >= req.percentage;
                    });
                });

            // --- Combination requirements (choose N of options) ---
            // New behavior: treat combination blocks as alternatives (OR).
            // Evaluate blocks in order; if any block is satisfied (satisfiedCount >= choose)
            // then the combination requirement passes. If none satisfy, it fails.
            let meetsCombination = true;
            if (
                Array.isArray(course.subjectCombinationRequirements) &&
                course.subjectCombinationRequirements.length
            ) {
                let anyBlockSatisfied = false;
                for (const comb of course.subjectCombinationRequirements) {
                    const choose = Number(comb.choose) || 1;
                    const opts = Array.isArray(comb.options)
                        ? comb.options
                        : [];
                    let satisfied = 0;
                    for (const opt of opts) {
                        const subjName = idToName
                            .get(opt.subjectId)
                            ?.toLowerCase();
                        const userPercent =
                            getUserPercentForSubject(subjName) || 0;
                        if (userPercent >= (Number(opt.percentage) || 0))
                            satisfied++;
                    }
                    // If this block is satisfied, we can short-circuit and accept the course
                    if (satisfied >= choose) {
                        anyBlockSatisfied = true;
                        break;
                    }
                    // otherwise continue to the next block (treated as alternative)
                }
                meetsCombination = anyBlockSatisfied;
            }

            // --- Final decision includes new language checks ---
            const finalDecision =
                aps >= (requiredAPS || course.apsRequirement || 0) &&
                meetsMath &&
                meetsOther &&
                meetsGroups &&
                meetsHomeLanguage &&
                meetsAdditionalLanguage &&
                meetsCombination;

            // console.log("Meets Math:", meetsMath);
            // console.log("Meets Other:", meetsOther);
            // console.log("Meets Subject Groups:", meetsGroups);
            // console.log("Meets Home Language:", meetsHomeLanguage);
            // console.log("Meets Additional Language:", meetsAdditionalLanguage);

            // console.log(
            //     ">>> Final Decision:",
            //     finalDecision ? "QUALIFIES ✅" : "Does NOT Qualify ❌"
            // );

            return finalDecision;
        })
        .map((course) => ({
            name: course.courseName,
            // code: course.courseCode,
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
