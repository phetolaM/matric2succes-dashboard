export const meta = {
    code: "unizulu",
    displayName: "University of Zulu-Land",
    collections: ["unizulu"],
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

    // Collect Home Language
    // Collect all subjects (exclude Life Orientation) and pick best 6 for APS
    const normalize = (s) => (s || "").toString().toLowerCase().trim();
    const seen = new Map(); // name -> percent (keep highest)

    const pushIfBetter = (rawName, percent) => {
        if (!rawName) return;
        const name = normalize(rawName);
        if (!name) return;
        if (/life orientation/i.test(name)) return;
        const p = Number(percent || 0);
        if (Number.isNaN(p)) return;
        const prev = seen.get(name);
        if (prev === undefined || p > prev) seen.set(name, p);
    };

    // Home Language
    if (data.homeLanguage && !/life orientation/i.test(data.homeLanguage)) {
        pushIfBetter(data.homeLanguage, data.homeLanguagePercent);
    }
    // Additional Language
    if (
        data.additionalLanguage &&
        !/life orientation/i.test(data.additionalLanguage)
    ) {
        pushIfBetter(data.additionalLanguage, data.additionalLanguagePercent);
    }

    // Best Mathematics (Math, Math Lit, Technical Math)
    const mathCandidates = [
        { name: "mathematics", percent: data.mathPercent },
        { name: "technical mathematics", percent: data.technicalMathPercent },
        { name: "mathematical literacy", percent: data.mathLitPercent },
    ];
    const bestMath = mathCandidates
        .filter((s) => s.percent !== undefined && s.percent !== null)
        .sort((a, b) => Number(b.percent || 0) - Number(a.percent || 0))[0];
    if (bestMath && Number(bestMath.percent) > 0)
        pushIfBetter(bestMath.name, bestMath.percent);

    // Other Subjects (excluding LO and duplicates of home/additional/math)
    (data.otherSubjects || [])
        .filter((s) => s && s.subject)
        .forEach((s) => {
            const name = s.subject;
            // exclude life orientation and math-like subjects
            if (/life orientation/i.test(name)) return;
            if (
                /mathematics/i.test(name.toLowerCase()) ||
                /technical mathematics/i.test(name.toLowerCase()) ||
                /mathematical literacy/i.test(name.toLowerCase())
            )
                return;
            // exclude explicit duplicates of home/additional
            const home = (data.homeLanguage || "").toString().toLowerCase();
            const add = (data.additionalLanguage || "")
                .toString()
                .toLowerCase();
            if (name.toLowerCase() === home || name.toLowerCase() === add)
                return;
            pushIfBetter(name, s.percent);
        });

    // Build an array of unique subjects and pick best 6 (excluding LO already)
    const all = Array.from(seen.entries()).map(([name, percent]) => ({
        name,
        percent,
    }));
    const best6 = all.sort((a, b) => b.percent - a.percent).slice(0, 6);

    // Calculate APS from best 6 (if less than 6, use what's available)
    let totalAPS = best6.reduce(
        (sum, s) => sum + percentToAps(Number(s.percent || 0)),
        0
    );

    console.log(`UNIZULU APS Score:  ${totalAPS}`);
    return { aps: totalAPS };
}

export function evaluateUserGeneralLevel(userSubjectsMap = new Map()) {
    // UNIZULU general-level rules implemented per spec
    const normalize = (s) => (s || "").toString().toLowerCase().trim();

    const get = (key) => {
        const v = userSubjectsMap.get(key);
        return typeof v === "number" ? v : Number(v || 0);
    };

    const homeLang = get("home language");
    const addLang = get("additional language");

    // Build list of other subject percents (exclude language keys and LO and any meta keys)
    const others = [];
    const allSubjects = [];
    for (const [k, v] of userSubjectsMap.entries()) {
        const key = (k || "").toString();
        if (!key) continue;
        if (key.toLowerCase().includes("subject")) continue; // skip meta keys that store subject names
        const lname = normalize(key);
        const pct = Number(v || 0);
        if (!isNaN(pct)) allSubjects.push(pct);
        if (
            lname === "home language" ||
            lname === "additional language" ||
            lname === "life orientation"
        )
            continue;
        if (!isNaN(pct)) others.push({ name: lname, percent: pct });
    }

    const countAtLeast = (threshold, list = others) =>
        list.filter((s) => Number(s.percent || 0) >= threshold).length;

    // Pass count: number of subjects (any) with >=30%
    const passCount = allSubjects.filter((p) => Number(p || 0) >= 30).length;

    // Higher Certificate rules
    const hc_ok =
        homeLang >= 40 &&
        // at least two other subjects >=40
        countAtLeast(40) >= 2 &&
        // at least four other subjects >=30
        countAtLeast(30) >= 4 &&
        // pass at least 6 out of 7 subjects
        passCount >= 6;

    // Diploma rules
    const diploma_ok =
        homeLang >= 40 &&
        // three other subjects >=40 (excluding LO)
        countAtLeast(40) >= 3 &&
        // additional language >=30
        addLang >= 30 &&
        passCount >= 6;

    // Degree (Bachelor) rules
    const degree_ok =
        homeLang >= 40 &&
        // four other subjects >=50 (excluding LO)
        countAtLeast(50) >= 4 &&
        addLang >= 30 &&
        // at least one other subject >=30
        countAtLeast(30) >= 1 &&
        passCount >= 6;

    if (degree_ok) return "bachelor";
    if (diploma_ok) return "diploma";
    if (hc_ok) return "higher certificate";
    return null;
}

export function getQualifiedCourses({
    aps,
    userSubjectsMap,
    courses,
    idToName,
    mathSubjects = meta.mathSubjects,
}) {
    // determine user's general qualification level according to UNIZULU rules
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

            // --- General level requirement: user must meet the course level or higher ---
            if (course.level) {
                const courseLevel = (course.level || "")
                    .toString()
                    .toLowerCase();
                const reqRank = levelRank[courseLevel] || 0;
                const userRank = levelRank[userGeneralLevel] || 0;
                if (userRank < reqRank) {
                    console.log(
                        `User does not meet general level requirement: needs ${courseLevel}, user: ${userGeneralLevel}`
                    );
                    return false;
                }
            }

            // --- Home / Additional Language Requirements ---
            // We support courses that may specify both homeLanguageRequirement
            // and additionalLanguageRequirement. If both refer to the same
            // language (or both are 'all'), we should enforce only the one
            // relevant to the user (i.e., whether the user took that language
            // as home or as additional). Otherwise both requirements must pass.

            const meetsHomeLanguage = (() => {
                if (
                    !course.homeLanguageRequirement ||
                    !course.homeLanguageRequirement.percentage
                )
                    return true;
                const required = course.homeLanguageRequirement;
                const requiredPercent = Number(required.percentage || 0);
                if (required.subjectId === "all") {
                    return (
                        Number(userSubjectsMap.get("home language") || 0) >=
                        requiredPercent
                    );
                }
                const subjectName = idToName
                    .get(required.subjectId)
                    ?.toLowerCase();
                return (
                    userSubjectsMap.get("home language subject") ===
                        subjectName &&
                    Number(userSubjectsMap.get("home language") || 0) >=
                        requiredPercent
                );
            })();

            const meetsAdditionalLanguage = (() => {
                if (
                    !course.additionalLanguageRequirement ||
                    !course.additionalLanguageRequirement.percentage
                )
                    return true;
                const required = course.additionalLanguageRequirement;
                const requiredPercent = Number(required.percentage || 0);
                if (required.subjectId === "all") {
                    return (
                        Number(
                            userSubjectsMap.get("additional language") || 0
                        ) >= requiredPercent
                    );
                }
                const subjectName = idToName
                    .get(required.subjectId)
                    ?.toLowerCase();
                return (
                    userSubjectsMap.get("additional language subject") ===
                        subjectName &&
                    Number(userSubjectsMap.get("additional language") || 0) >=
                        requiredPercent
                );
            })();

            // If both language requirements exist and they target the same language id
            // (or both are 'all'), choose the requirement that corresponds to the
            // way the user presented that language (home vs additional). If the user
            // didn't present that language at all, the requirement fails.
            let meetsLanguageRequirement = true;
            if (
                course.homeLanguageRequirement &&
                course.additionalLanguageRequirement &&
                course.homeLanguageRequirement.subjectId &&
                course.additionalLanguageRequirement.subjectId &&
                (course.homeLanguageRequirement.subjectId ===
                    course.additionalLanguageRequirement.subjectId ||
                    course.homeLanguageRequirement.subjectId === "all" ||
                    course.additionalLanguageRequirement.subjectId === "all")
            ) {
                const homeSubject = course.homeLanguageRequirement.subjectId;
                const addSubject =
                    course.additionalLanguageRequirement.subjectId;
                // resolve subjectName (if specific), otherwise treat as 'all'
                const requiredSubjectName =
                    homeSubject === "all"
                        ? "all"
                        : idToName.get(homeSubject)?.toLowerCase();

                const userHomeSubject = userSubjectsMap.get(
                    "home language subject"
                );
                const userAddSubject = userSubjectsMap.get(
                    "additional language subject"
                );

                if (requiredSubjectName === "all") {
                    // If course accepts any language, pass if either user language meets its respective requirement
                    meetsLanguageRequirement =
                        meetsHomeLanguage || meetsAdditionalLanguage;
                } else if (
                    userHomeSubject === requiredSubjectName &&
                    userAddSubject !== requiredSubjectName
                ) {
                    meetsLanguageRequirement = meetsHomeLanguage;
                } else if (
                    userAddSubject === requiredSubjectName &&
                    userHomeSubject !== requiredSubjectName
                ) {
                    meetsLanguageRequirement = meetsAdditionalLanguage;
                } else if (
                    userHomeSubject === requiredSubjectName &&
                    userAddSubject === requiredSubjectName
                ) {
                    // Unusual: user has same language listed as both home and additional; accept if either meets
                    meetsLanguageRequirement =
                        meetsHomeLanguage || meetsAdditionalLanguage;
                } else {
                    // user does not have the required language
                    meetsLanguageRequirement = false;
                }
            } else {
                // Requirements target different languages (or one is missing) — both must pass
                meetsLanguageRequirement =
                    meetsHomeLanguage && meetsAdditionalLanguage;
            }

            // Helper to evaluate a single requirement-set (AND reqs + OR groups)
            // Returns true if the user satisfies the set. Claims are local per-set.
            const evaluateRequirementSet = (reqs = [], groups = []) => {
                const mathReqsLocal = (reqs || []).filter((r) =>
                    mathSubjects.includes(r.subjectId)
                );
                const otherReqsLocal = (reqs || []).filter(
                    (r) => !mathSubjects.includes(r.subjectId)
                );

                const claimedLocal = new Set();

                // Math: at least one math req satisfied (if any math reqs exist)
                let meetsMathLocal = true;
                if (mathReqsLocal.length) {
                    meetsMathLocal = false;
                    for (const req of mathReqsLocal) {
                        const subject = idToName
                            .get(req.subjectId)
                            ?.toLowerCase();
                        const userPercent = userSubjectsMap.get(subject) || 0;
                        if (userPercent >= req.percentage) {
                            meetsMathLocal = true;
                            if (subject) claimedLocal.add(subject);
                            break;
                        }
                    }
                }

                // AND requirements
                let meetsOtherLocal = true;
                if (otherReqsLocal.length) {
                    meetsOtherLocal = otherReqsLocal.every((req) => {
                        const subject = idToName
                            .get(req.subjectId)
                            ?.toLowerCase();
                        const userPercent = userSubjectsMap.get(subject) || 0;
                        const ok = userPercent >= req.percentage;
                        if (ok && subject) claimedLocal.add(subject);
                        return ok;
                    });
                }

                // OR groups: each group must have at least one satisfied subject not already claimed
                let meetsGroupsLocal = true;
                if ((groups || []).length) {
                    for (const group of groups) {
                        let groupSatisfied = false;
                        for (const req of group) {
                            const subject = idToName
                                .get(req.subjectId)
                                ?.toLowerCase();
                            if (!subject) continue;
                            if (claimedLocal.has(subject)) continue;
                            const userPercent =
                                userSubjectsMap.get(subject) || 0;
                            if (userPercent >= req.percentage) {
                                groupSatisfied = true;
                                claimedLocal.add(subject);
                                break;
                            }
                        }
                        if (!groupSatisfied) {
                            meetsGroupsLocal = false;
                            break;
                        }
                    }
                }

                return meetsMathLocal && meetsOtherLocal && meetsGroupsLocal;
            };

            // Determine whether this course uses subjectRequirementCombinations
            const combinations = course.subjectRequirementCombinations || null;

            let meetsMath = true;
            let meetsOther = true;
            let meetsGroups = true;

            if (combinations && combinations.length) {
                // UNIZULU-specific behaviour for combinations:
                // Each combination is considered satisfied if any ONE of its
                // groups is fully satisfied. A "group" in UNIZULU combinations
                // is treated as an AND-set: all subjects listed in that group
                // must meet their percentage requirement. We evaluate groups
                // sequentially (group 1, then group 2, ...). If any group in
                // the combination passes, the combination is satisfied. If a
                // combination contains legacy AND-style subjectRequirements we
                // fall back to the generic evaluator for backwards-compat.
                let comboSatisfied = false;
                for (const combo of combinations) {
                    const comboReqs = combo.subjectRequirements || [];
                    const comboGroups = combo.subjectRequirementGroups || [];

                    // If the combination only defines groups, apply the
                    // sequential-group (AND-within-group) semantics.
                    if (
                        (!comboReqs || comboReqs.length === 0) &&
                        comboGroups.length
                    ) {
                        for (const group of comboGroups) {
                            let allInGroupOk = true;
                            for (const req of group) {
                                const subject = idToName
                                    .get(req.subjectId)
                                    ?.toLowerCase();
                                const userPercent =
                                    userSubjectsMap.get(subject) || 0;
                                if (userPercent < req.percentage) {
                                    allInGroupOk = false;
                                    break;
                                }
                            }
                            if (allInGroupOk) {
                                comboSatisfied = true;
                                break; // no need to check later groups in this combo
                            }
                        }
                        if (comboSatisfied) break; // one combo passed
                    } else {
                        // Fallback: use the existing generic evaluator which
                        // supports AND reqs + OR groups semantics.
                        if (evaluateRequirementSet(comboReqs, comboGroups)) {
                            comboSatisfied = true;
                            break;
                        }
                    }
                }

                meetsMath = comboSatisfied;
                meetsOther = comboSatisfied;
                meetsGroups = comboSatisfied;
            } else {
                // Legacy behaviour: top-level requirements
                const mathReqs = course.subjectRequirements?.filter((req) =>
                    mathSubjects.includes(req.subjectId)
                );
                const otherReqs = course.subjectRequirements?.filter(
                    (req) => !mathSubjects.includes(req.subjectId)
                );

                // We'll keep track of subjects that have been "claimed" by requirements
                // so that the same subject cannot be reused to satisfy multiple requirements
                // (AND requirements reserve their subjects; OR groups reserve one subject each).
                const claimed = new Set();

                // Evaluate math requirements: must have at least one math requirement satisfied
                meetsMath = true;
                if (mathReqs?.length) {
                    meetsMath = false;
                    for (const req of mathReqs) {
                        const subject = idToName
                            .get(req.subjectId)
                            ?.toLowerCase();
                        const userPercent = userSubjectsMap.get(subject) || 0;
                        if (userPercent >= req.percentage) {
                            meetsMath = true;
                            if (subject) claimed.add(subject);
                            break;
                        }
                    }
                }

                // Evaluate OTHER (AND) requirements: all must be satisfied; they reserve their subjects
                meetsOther = true;
                if (otherReqs?.length) {
                    meetsOther = otherReqs.every((req) => {
                        const subject = idToName
                            .get(req.subjectId)
                            ?.toLowerCase();
                        const userPercent = userSubjectsMap.get(subject) || 0;
                        const ok = userPercent >= req.percentage;
                        if (ok && subject) claimed.add(subject);
                        return ok;
                    });
                }

                // Evaluate OR groups: iterate groups and for each group find a subject that
                // satisfies the requirement and is not already claimed by AND or a previous group.
                const groups = course.subjectRequirementGroups || [];
                meetsGroups = true;
                if (groups.length) {
                    for (const group of groups) {
                        let groupSatisfied = false;
                        for (const req of group) {
                            const subject = idToName
                                .get(req.subjectId)
                                ?.toLowerCase();
                            if (!subject) continue;
                            if (claimed.has(subject)) continue; // already used by AND or previous group
                            const userPercent =
                                userSubjectsMap.get(subject) || 0;
                            if (userPercent >= req.percentage) {
                                groupSatisfied = true;
                                claimed.add(subject);
                                break;
                            }
                        }
                        if (!groupSatisfied) {
                            meetsGroups = false;
                            break;
                        }
                    }
                }
            }

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

// Validate course payload for UNIZULU-specific rules:
// - AND subjects must not appear in OR groups
// - subjects must not be used in more than one OR group
export function validateCourseSubjects(course) {
    // Validate top-level AND vs OR groups
    const andIdsTop = (course.subjectRequirements || [])
        .map((r) => r.subjectId)
        .filter(Boolean);

    const groupListsTop = (course.subjectRequirementGroups || []).map((g) =>
        (g || []).map((it) => it.subjectId).filter(Boolean)
    );

    for (const id of andIdsTop) {
        for (const g of groupListsTop) {
            if (g.includes(id)) {
                return `Subject ${id} is listed in AND requirements and also appears in an OR group`;
            }
        }
    }

    // If the course defines combinations, validate each combination separately
    // (AND subjects within a combination must not also appear in that combination's OR groups).
    const combinations = course.subjectRequirementCombinations || [];
    for (let ci = 0; ci < combinations.length; ci++) {
        const combo = combinations[ci] || {};
        // UNIZULU-specific rule: combinations should only contain groups
        // (no AND-style subjectRequirements). Enforce at save-time.
        if (combo.subjectRequirements && combo.subjectRequirements.length) {
            return `Combination #${
                ci + 1
            } must not define AND-style subjectRequirements for UNIZULU; use groups only`;
        }
        const andIds = (combo.subjectRequirements || [])
            .map((r) => r.subjectId)
            .filter(Boolean);
        const groupLists = (combo.subjectRequirementGroups || []).map((g) =>
            (g || []).map((it) => it.subjectId).filter(Boolean)
        );
        for (const id of andIds) {
            for (const g of groupLists) {
                if (g.includes(id)) {
                    return `Subject ${id} is listed in AND requirements and also appears in an OR group of combination #${
                        ci + 1
                    }`;
                }
            }
        }
    }

    // Allow the same subject to appear in multiple OR groups or across combinations.
    // The UI will warn about duplicates; backend does not block based on reuse.
    return null;
}
