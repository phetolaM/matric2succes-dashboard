// Special requirement placeholders (top-level)
const SPECIAL_REMAINING_LANGUAGE = "remaining-language";
const SPECIAL_REMAINING_SUBJECT = "remaining-subject";
const isSpecialPlaceholder = (id) =>
    id === SPECIAL_REMAINING_LANGUAGE || id === SPECIAL_REMAINING_SUBJECT;

function resolveRemainingLanguage(userSubjectsMap, idToName) {
    // Only check for language subjects: home language and additional language
    const homeLangName = (userSubjectsMap.get("home language subject") || "")
        .toString()
        .toLowerCase();
    const addLangName = (
        userSubjectsMap.get("additional language subject") || ""
    )
        .toString()
        .toLowerCase();
    const homeLangPercent = Number(userSubjectsMap.get("home language") || 0);
    const addLangPercent = Number(
        userSubjectsMap.get("additional language") || 0
    );
    let candidate = null;
    if (homeLangName) {
        candidate = { name: homeLangName, percent: homeLangPercent };
    }
    if (addLangName) {
        if (!candidate || addLangPercent > candidate.percent) {
            candidate = { name: addLangName, percent: addLangPercent };
        }
    }
    if (!candidate) {
        // console.log("[WSU DEBUG][REMAINING-LANG] No language subject found");
        return { percent: 0, matchedSubjectId: null };
    }
    const matchedSubjectId =
        Array.from(idToName.entries()).find(
            ([, v]) => (v || "").toLowerCase() === candidate.name
        )?.[0] || null;
    // console.log("[WSU DEBUG][REMAINING-LANG] candidate=", {
    //     name: candidate.name,
    //     percent: candidate.percent,
    //     matchedSubjectId,
    // });
    return { percent: candidate.percent, matchedSubjectId };
}

function resolveRemainingSubject(
    userSubjectsMap,
    idToName,
    excludedSubjectIds,
    minPercent = 0,
    allowLifeOrientation = false
) {
    const pool = Array.from(userSubjectsMap.entries())
        .filter(([key, value]) => {
            // Exclude language subjects and optionally Life Orientation
            if (typeof value !== "number") return false;
            if (key.endsWith(" subject")) return false;
            if (!allowLifeOrientation && /life orientation/i.test(key))
                return false;
            if (/home language|additional language/i.test(key)) return false;
            return true;
        })
        .map(([key, percent]) => ({
            name: key,
            percent: Number(percent || 0),
            subjectId:
                Array.from(idToName.entries()).find(
                    ([, v]) => (v || "").toLowerCase() === key
                )?.[0] || null,
        }))
        .filter((s) => s.subjectId && !excludedSubjectIds.has(s.subjectId));
    const match = pool.find((s) => s.percent >= minPercent);
    if (!match) {
        // console.log("[WSU DEBUG][REMAINING-SUBJECT] No match >= min%", {
        //     minPercent,
        //     poolSize: pool.length,
        //     excludedCount: excludedSubjectIds.size,
        // });
        return { percent: 0, matchedSubjectId: null };
    }
    // console.log("[WSU DEBUG][REMAINING-SUBJECT] Matched subject", {
    //     name: match.name,
    //     percent: match.percent,
    //     subjectId: match.subjectId,
    //     minPercent,
    // });
    return { percent: match.percent, matchedSubjectId: match.subjectId };
}

// Helper: Check if any N remaining subjects total at least a given APS
function hasNAdditionalSubjectsTotalling(
    numSubjects,
    minTotalAps,
    userSubjectsMap,
    idToName,
    usedSubjectIds = new Set(),
    allowLifeOrientation = false
) {
    // Build a list of all subjects and their APS, excluding usedSubjectIds and optionally Life Orientation
    const percentToAps = (percent) => {
        // if (percent >= 90) return 8;
        if (percent >= 80) return 7;
        if (percent >= 70) return 6;
        if (percent >= 60) return 5;
        if (percent >= 50) return 4;
        if (percent >= 40) return 3;
        if (percent >= 30) return 2;
        return 1;
    };
    const allSubjects = Array.from(userSubjectsMap.entries())
        .filter(
            ([key, value]) =>
                typeof value === "number" &&
                !key.endsWith(" subject") &&
                (allowLifeOrientation || !/life orientation/i.test(key))
        )
        .map(([key, percent]) => ({
            name: key,
            percent,
            subjectId:
                Array.from(idToName.entries()).find(
                    ([, v]) => v?.toLowerCase() === key
                )?.[0] || null,
            aps: percentToAps(percent),
        }))
        .filter((s) => s.subjectId && !usedSubjectIds.has(s.subjectId));
    // console.log("[WSU DEBUG][N-SUBJECTS] pool=", allSubjects.length, {
    //     numSubjects,
    //     minTotalAps,
    //     excludedCount: usedSubjectIds.size,
    // });
    if (allSubjects.length < numSubjects) return false;
    // Try all combinations of numSubjects
    function* combinations(arr, k) {
        const n = arr.length;
        if (k > n) return;
        const indices = Array.from({ length: k }, (_, i) => i);
        yield indices.map((i) => arr[i]);
        while (true) {
            let i = k - 1;
            while (i >= 0 && indices[i] === i + n - k) i--;
            if (i < 0) return;
            indices[i]++;
            for (let j = i + 1; j < k; j++) {
                indices[j] = indices[j - 1] + 1;
            }
            yield indices.map((i) => arr[i]);
        }
    }
    for (const combo of combinations(allSubjects, numSubjects)) {
        const totalAps = combo.reduce((sum, s) => sum + s.aps, 0);
        if (totalAps >= minTotalAps) {
            // console.log(
            //     "[WSU DEBUG][N-SUBJECTS] Found combo meeting total APS",
            //     {
            //         combo: combo.map((c) => ({ name: c.name, aps: c.aps })),
            //         totalAps,
            //     }
            // );
            return true;
        }
    }
    return false;
}

// Helper: mainstream eligibility
function isMainstreamEligible({
    // Logging after destructuring
    // (moved inside function body below)
    aps,
    userSubjectsMap,
    course,
    idToName,
    mathSubjects,
}) {
    // console.log(
    //     `[WSU MAINSTREAM CHECK] Checking mainstream eligibility for course: ${course.courseName}`
    // );
    const hasMath = userSubjectsMap.get("mathematics") > 0;
    const hasTechMath = userSubjectsMap.get("technical mathematics") > 0;
    const hasMathLit = userSubjectsMap.get("mathematical literacy") > 0;

    // Determine required APS based on math subject
    let requiredAPS = course.apsRequirement;
    if (hasMath && course.apsRequirementMathematics)
        requiredAPS = course.apsRequirementMathematics;
    else if (hasTechMath && course.apsRequirementTechnicalMath)
        requiredAPS = course.apsRequirementTechnicalMath;
    else if (hasMathLit && course.apsRequirementMathLit)
        requiredAPS = course.apsRequirementMathLit;

    // If no APS requirement found at all, skip this course
    if (!requiredAPS && requiredAPS !== 0) {
        // console.log(
        //     `[WSU MAINSTREAM CHECK] No APS requirement found for ${course.courseName}`
        // );
        return false;
    }

    // Home Language
    let meetsHomeLanguage = true;
    if (
        course.homeLanguageRequirement &&
        course.homeLanguageRequirement.percentage
    ) {
        const required = course.homeLanguageRequirement;
        const requiredPercent = Number(required.percentage);
        if (required.subjectId === "all") {
            meetsHomeLanguage =
                typeof userSubjectsMap.get("home language") === "number" &&
                userSubjectsMap.get("home language") >= requiredPercent;
        } else if (required.subjectId) {
            const subjectName = idToName.get(required.subjectId)?.toLowerCase();
            meetsHomeLanguage =
                userSubjectsMap.get("home language subject") === subjectName &&
                userSubjectsMap.get("home language") >= requiredPercent;
        }
    }
    // Additional Language
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
                userSubjectsMap.get("additional language") >= requiredPercent;
        } else if (required.subjectId) {
            const subjectName = idToName.get(required.subjectId)?.toLowerCase();
            meetsAdditionalLanguage =
                userSubjectsMap.get("additional language subject") ===
                    subjectName &&
                userSubjectsMap.get("additional language") >= requiredPercent;
        }
    }
    const mathReqs = course.subjectRequirements?.filter(
        (req) =>
            !isSpecialPlaceholder(req.subjectId) &&
            mathSubjects.includes(req.subjectId)
    );
    const otherReqs = course.subjectRequirements?.filter(
        (req) =>
            isSpecialPlaceholder(req.subjectId) ||
            !mathSubjects.includes(req.subjectId)
    );
    const meetsMath =
        !mathReqs?.length ||
        mathReqs.some((req) => {
            const subject = idToName.get(req.subjectId)?.toLowerCase();
            const userPercent = userSubjectsMap.get(subject) || 0;
            return userPercent >= req.percentage;
        });
    let usedSubjectIdsForAnd = new Set();

    // Split otherReqs into three groups: explicit subjects, remaining language, and remaining subject
    const explicitReqs =
        otherReqs?.filter((req) => !isSpecialPlaceholder(req.subjectId)) || [];
    const remainingLangReqs =
        otherReqs?.filter(
            (req) => req.subjectId === SPECIAL_REMAINING_LANGUAGE
        ) || [];
    const remainingSubjectReqs =
        otherReqs?.filter(
            (req) => req.subjectId === SPECIAL_REMAINING_SUBJECT
        ) || [];

    // Check explicit subjects first
    const meetsExplicit = explicitReqs.every((req) => {
        const subject = idToName.get(req.subjectId)?.toLowerCase();
        const userPercent = userSubjectsMap.get(subject) || 0;
        const ok = userPercent >= req.percentage;
        if (ok) usedSubjectIdsForAnd.add(req.subjectId);
        return ok;
    });

    // Then check remaining language (if needed)
    const meetsRemainingLang = remainingLangReqs.every((req) => {
        const { percent, matchedSubjectId } = resolveRemainingLanguage(
            userSubjectsMap,
            idToName
        );
        const ok = percent >= Number(req.percentage || 0);
        if (ok && matchedSubjectId) usedSubjectIdsForAnd.add(matchedSubjectId);
        // console.log("[WSU DEBUG][AND] Remaining Language", {
        //     required: Number(req.percentage || 0),
        //     got: percent,
        //     ok,
        // });
        return ok;
    });

    // Finally check remaining subject (second to last priority)
    const meetsRemainingSubject = remainingSubjectReqs.every((req) => {
        // Exclude all explicit subject requirements and already-used subjects
        const excluded = new Set([
            ...(course.subjectRequirements || [])
                .filter(
                    (r) => r.subjectId && !isSpecialPlaceholder(r.subjectId)
                )
                .map((r) => r.subjectId),
            ...usedSubjectIdsForAnd,
        ]);
        const { percent, matchedSubjectId } = resolveRemainingSubject(
            userSubjectsMap,
            idToName,
            excluded,
            Number(req.percentage || 0),
            course.allowLifeOrientation || false
        );
        const ok = percent >= Number(req.percentage || 0);
        if (ok && matchedSubjectId) usedSubjectIdsForAnd.add(matchedSubjectId);
        // console.log("[WSU DEBUG][AND] Remaining Subject", {
        //     required: Number(req.percentage || 0),
        //     got: percent,
        //     ok,
        // });
        return ok;
    });

    const meetsOther =
        meetsExplicit && meetsRemainingLang && meetsRemainingSubject;
    // Groups
    const meetsGroups = (() => {
        if (!course.subjectRequirementGroups?.length) return true;
        const excludedSubjectIds = new Set(
            (course.subjectRequirements || [])
                .filter(
                    (req) =>
                        req.subjectId && !isSpecialPlaceholder(req.subjectId)
                )
                .map((req) => req.subjectId)
        );
        if (
            course.homeLanguageRequirement &&
            course.homeLanguageRequirement.subjectId &&
            course.homeLanguageRequirement.subjectId !== "all"
        )
            excludedSubjectIds.add(course.homeLanguageRequirement.subjectId);
        if (
            course.additionalLanguageRequirement &&
            course.additionalLanguageRequirement.subjectId &&
            course.additionalLanguageRequirement.subjectId !== "all"
        )
            excludedSubjectIds.add(
                course.additionalLanguageRequirement.subjectId
            );
        let userHomeLangId = null;
        let userAdditionalLangId = null;
        if (userSubjectsMap.get("home language subject"))
            userHomeLangId = Array.from(idToName.entries()).find(
                ([, v]) =>
                    v?.toLowerCase() ===
                    userSubjectsMap.get("home language subject")
            )?.[0];
        if (userSubjectsMap.get("additional language subject"))
            userAdditionalLangId = Array.from(idToName.entries()).find(
                ([, v]) =>
                    v?.toLowerCase() ===
                    userSubjectsMap.get("additional language subject")
            )?.[0];
        if (
            course.homeLanguageRequirement &&
            course.homeLanguageRequirement.subjectId === "all" &&
            course.homeLanguageRequirement.percentage &&
            userHomeLangId
        )
            excludedSubjectIds.add(userHomeLangId);
        if (
            course.additionalLanguageRequirement &&
            course.additionalLanguageRequirement.subjectId === "all" &&
            course.additionalLanguageRequirement.percentage &&
            userAdditionalLangId
        )
            excludedSubjectIds.add(userAdditionalLangId);
        const userSubjects = Array.from(userSubjectsMap.entries())
            .filter(
                ([key, value]) =>
                    typeof value === "number" &&
                    key !== "home language" &&
                    key !== "additional language" &&
                    !key.endsWith(" subject")
            )
            .map(([key, percent]) => ({
                name: key,
                percent,
                subjectId:
                    Array.from(idToName.entries()).find(
                        ([, v]) => v?.toLowerCase() === key
                    )?.[0] || null,
            }))
            .filter((s) => s.subjectId && !excludedSubjectIds.has(s.subjectId));
        let usedSubjectIds = new Set();
        for (
            let groupIdx = 0;
            groupIdx < course.subjectRequirementGroups.length;
            groupIdx++
        ) {
            const group = course.subjectRequirementGroups[groupIdx];
            const pool = userSubjects.filter(
                (s) => !usedSubjectIds.has(s.subjectId)
            );
            if (
                group.length > 0 &&
                group.every((req) => req.percentage === group[0].percentage) &&
                group.length > 5
            ) {
                const requiredPercent = Number(group[0].percentage);
                const match = pool
                    .filter((s) => s.percent >= requiredPercent)
                    .sort((a, b) => b.percent - a.percent)[0];
                if (match) usedSubjectIds.add(match.subjectId);
                else return false;
            } else {
                let matchedIdInGroup = null;

                // Priority 1: Check explicit subjects first
                const explicitMatch = group.find((req) => {
                    if (isSpecialPlaceholder(req.subjectId)) return false;
                    const subject = idToName.get(req.subjectId)?.toLowerCase();
                    const userPercent = userSubjectsMap.get(subject) || 0;
                    // Check if subject meets requirement AND hasn't been used in a previous group
                    if (
                        userPercent >= req.percentage &&
                        !usedSubjectIds.has(req.subjectId)
                    ) {
                        matchedIdInGroup = req.subjectId;
                        // console.log(
                        //     "[WSU DEBUG][GROUP] Matched Explicit Subject",
                        //     {
                        //         matchedIdInGroup,
                        //         userPercent,
                        //         required: Number(req.percentage || 0),
                        //     }
                        // );
                        return true;
                    }
                    return false;
                });

                // Priority 2: If no explicit match, check remaining language
                let remainingLangMatch = null;
                if (!explicitMatch) {
                    remainingLangMatch = group.find((req) => {
                        if (req.subjectId !== SPECIAL_REMAINING_LANGUAGE)
                            return false;
                        const { percent, matchedSubjectId } =
                            resolveRemainingLanguage(userSubjectsMap, idToName);
                        if (percent >= Number(req.percentage || 0)) {
                            matchedIdInGroup = matchedSubjectId;
                            // console.log(
                            //     "[WSU DEBUG][GROUP] Matched Remaining Language",
                            //     {
                            //         matchedIdInGroup,
                            //         percent,
                            //         required: Number(req.percentage || 0),
                            //     }
                            // );
                            return true;
                        }
                        return false;
                    });
                }

                // Priority 3: If no explicit or language match, check remaining subject (second to last)
                let remainingSubjectMatch = null;
                if (!explicitMatch && !remainingLangMatch) {
                    remainingSubjectMatch = group.find((req) => {
                        if (req.subjectId !== SPECIAL_REMAINING_SUBJECT)
                            return false;
                        const localExcluded = new Set([
                            ...excludedSubjectIds,
                            ...usedSubjectIds,
                        ]);
                        const { percent, matchedSubjectId } =
                            resolveRemainingSubject(
                                userSubjectsMap,
                                idToName,
                                localExcluded,
                                Number(req.percentage || 0),
                                course.allowLifeOrientation || false
                            );
                        if (percent >= Number(req.percentage || 0)) {
                            matchedIdInGroup = matchedSubjectId;
                            // console.log(
                            //     "[WSU DEBUG][GROUP] Matched Remaining Subject",
                            //     {
                            //         matchedIdInGroup,
                            //         percent,
                            //         required: Number(req.percentage || 0),
                            //     }
                            // );
                            return true;
                        }
                        return false;
                    });
                }

                const groupMet =
                    explicitMatch ||
                    remainingLangMatch ||
                    remainingSubjectMatch;

                if (groupMet) {
                    if (matchedIdInGroup) usedSubjectIds.add(matchedIdInGroup);
                    else
                        group.forEach(
                            (req) =>
                                !isSpecialPlaceholder(req.subjectId) &&
                                usedSubjectIds.add(req.subjectId)
                        );
                } else return false;
            }
        }
        return true;
    })();
    let meetsAdditionalSubjects = true;
    if (course.numAdditionalSubjects && course.totalApsForAdditionalSubjects) {
        // Build set of used subject IDs from requirements
        const usedSubjectIds = new Set();
        (course.subjectRequirements || []).forEach((req) =>
            usedSubjectIds.add(req.subjectId)
        );
        if (
            course.homeLanguageRequirement &&
            course.homeLanguageRequirement.subjectId &&
            course.homeLanguageRequirement.subjectId !== "all"
        )
            usedSubjectIds.add(course.homeLanguageRequirement.subjectId);
        if (
            course.additionalLanguageRequirement &&
            course.additionalLanguageRequirement.subjectId &&
            course.additionalLanguageRequirement.subjectId !== "all"
        )
            usedSubjectIds.add(course.additionalLanguageRequirement.subjectId);
        meetsAdditionalSubjects = hasNAdditionalSubjectsTotalling(
            course.numAdditionalSubjects,
            course.totalApsForAdditionalSubjects,
            userSubjectsMap,
            idToName,
            usedSubjectIds,
            course.allowLifeOrientation || false
        );
    }
    return (
        aps >= (course.apsRequirement || 0) &&
        meetsMath &&
        meetsOther &&
        meetsGroups &&
        meetsHomeLanguage &&
        meetsAdditionalLanguage &&
        meetsAdditionalSubjects
    );
}

// Helper: extended eligibility
function isExtendedEligible({
    // Logging after destructuring
    // (moved inside function body below)
    aps,
    userSubjectsMap,
    course,
    idToName,
    mathSubjects,
}) {
    // console.log(
    //     `[WSU EXTENDED CHECK] Checking extended eligibility for course: ${course.courseName}`
    // );
    if (
        isMainstreamEligible({
            aps,
            userSubjectsMap,
            course,
            idToName,
            mathSubjects,
        })
    )
        return false;
    // Reuse meetsGroups, meetsHomeLanguage, meetsAdditionalLanguage from above
    // Track which subjects were used in groups to exclude from near-miss counting
    let subjectsUsedInGroups = new Set();

    const meetsGroups = (() => {
        if (!course.subjectRequirementGroups?.length) return true;
        const excludedSubjectIds = new Set(
            (course.subjectRequirements || [])
                .filter(
                    (req) =>
                        req.subjectId && !isSpecialPlaceholder(req.subjectId)
                )
                .map((req) => req.subjectId)
        );
        if (
            course.homeLanguageRequirement &&
            course.homeLanguageRequirement.subjectId &&
            course.homeLanguageRequirement.subjectId !== "all"
        )
            excludedSubjectIds.add(course.homeLanguageRequirement.subjectId);
        if (
            course.additionalLanguageRequirement &&
            course.additionalLanguageRequirement.subjectId &&
            course.additionalLanguageRequirement.subjectId !== "all"
        )
            excludedSubjectIds.add(
                course.additionalLanguageRequirement.subjectId
            );
        let userHomeLangId = null;
        let userAdditionalLangId = null;
        if (userSubjectsMap.get("home language subject"))
            userHomeLangId = Array.from(idToName.entries()).find(
                ([, v]) =>
                    v?.toLowerCase() ===
                    userSubjectsMap.get("home language subject")
            )?.[0];
        if (userSubjectsMap.get("additional language subject"))
            userAdditionalLangId = Array.from(idToName.entries()).find(
                ([, v]) =>
                    v?.toLowerCase() ===
                    userSubjectsMap.get("additional language subject")
            )?.[0];
        if (
            course.homeLanguageRequirement &&
            course.homeLanguageRequirement.subjectId === "all" &&
            course.homeLanguageRequirement.percentage &&
            userHomeLangId
        )
            excludedSubjectIds.add(userHomeLangId);
        if (
            course.additionalLanguageRequirement &&
            course.additionalLanguageRequirement.subjectId === "all" &&
            course.additionalLanguageRequirement.percentage &&
            userAdditionalLangId
        )
            excludedSubjectIds.add(userAdditionalLangId);
        const userSubjects = Array.from(userSubjectsMap.entries())
            .filter(
                ([key, value]) =>
                    typeof value === "number" &&
                    key !== "home language" &&
                    key !== "additional language" &&
                    !key.endsWith(" subject")
            )
            .map(([key, percent]) => ({
                name: key,
                percent,
                subjectId:
                    Array.from(idToName.entries()).find(
                        ([, v]) => v?.toLowerCase() === key
                    )?.[0] || null,
            }))
            .filter((s) => s.subjectId && !excludedSubjectIds.has(s.subjectId));
        let usedSubjectIds = new Set();
        for (
            let groupIdx = 0;
            groupIdx < course.subjectRequirementGroups.length;
            groupIdx++
        ) {
            const group = course.subjectRequirementGroups[groupIdx];
            const pool = userSubjects.filter(
                (s) => !usedSubjectIds.has(s.subjectId)
            );
            if (
                group.length > 0 &&
                group.every((req) => req.percentage === group[0].percentage) &&
                group.length > 5
            ) {
                const requiredPercent = Number(group[0].percentage);
                const match = pool
                    .filter((s) => s.percent >= requiredPercent)
                    .sort((a, b) => b.percent - a.percent)[0];
                if (match) usedSubjectIds.add(match.subjectId);
                else return false;
            } else {
                let matchedIdInGroup = null;

                // Priority 1: Check explicit subjects first
                const explicitMatch = group.find((req) => {
                    if (isSpecialPlaceholder(req.subjectId)) return false;
                    const subject = idToName.get(req.subjectId)?.toLowerCase();
                    const userPercent = userSubjectsMap.get(subject) || 0;
                    // Check if subject meets requirement AND hasn't been used in a previous group
                    if (
                        userPercent >= req.percentage &&
                        !usedSubjectIds.has(req.subjectId)
                    ) {
                        matchedIdInGroup = req.subjectId;
                        // console.log(
                        //     "[WSU DEBUG][GROUP][EXT] Matched Explicit Subject",
                        //     {
                        //         matchedIdInGroup,
                        //         userPercent,
                        //         required: Number(req.percentage || 0),
                        //     }
                        // );
                        return true;
                    }
                    return false;
                });

                // Priority 2: If no explicit match, check remaining language
                let remainingLangMatch = null;
                if (!explicitMatch) {
                    remainingLangMatch = group.find((req) => {
                        if (req.subjectId !== SPECIAL_REMAINING_LANGUAGE)
                            return false;
                        const { percent, matchedSubjectId } =
                            resolveRemainingLanguage(userSubjectsMap, idToName);
                        if (percent >= Number(req.percentage || 0)) {
                            matchedIdInGroup = matchedSubjectId;
                            // console.log(
                            //     "[WSU DEBUG][GROUP][EXT] Matched Remaining Language",
                            //     {
                            //         matchedIdInGroup,
                            //         percent,
                            //         required: Number(req.percentage || 0),
                            //     }
                            // );
                            return true;
                        }
                        return false;
                    });
                }

                // Priority 3: If no explicit or language match, check remaining subject (second to last)
                let remainingSubjectMatch = null;
                if (!explicitMatch && !remainingLangMatch) {
                    remainingSubjectMatch = group.find((req) => {
                        if (req.subjectId !== SPECIAL_REMAINING_SUBJECT)
                            return false;
                        const localExcluded = new Set([
                            ...excludedSubjectIds,
                            ...usedSubjectIds,
                        ]);
                        const { percent, matchedSubjectId } =
                            resolveRemainingSubject(
                                userSubjectsMap,
                                idToName,
                                localExcluded,
                                Number(req.percentage || 0),
                                course.allowLifeOrientation || false
                            );
                        if (percent >= Number(req.percentage || 0)) {
                            matchedIdInGroup = matchedSubjectId;
                            // console.log(
                            //     "[WSU DEBUG][GROUP][EXT] Matched Remaining Subject",
                            //     {
                            //         matchedIdInGroup,
                            //         percent,
                            //         required: Number(req.percentage || 0),
                            //     }
                            // );
                            return true;
                        }
                        return false;
                    });
                }

                const groupMet =
                    explicitMatch ||
                    remainingLangMatch ||
                    remainingSubjectMatch;

                if (groupMet) {
                    if (matchedIdInGroup) {
                        usedSubjectIds.add(matchedIdInGroup);
                        subjectsUsedInGroups.add(matchedIdInGroup); // Track for extended logic
                    } else {
                        group.forEach((req) => {
                            if (!isSpecialPlaceholder(req.subjectId)) {
                                usedSubjectIds.add(req.subjectId);
                                subjectsUsedInGroups.add(req.subjectId); // Track for extended logic
                            }
                        });
                    }
                } else return false;
            }
        }
        return true;
    })();
    // Home Language
    let meetsHomeLanguage = true;
    if (
        course.homeLanguageRequirement &&
        course.homeLanguageRequirement.percentage
    ) {
        const required = course.homeLanguageRequirement;
        const requiredPercent = Number(required.percentage);
        if (required.subjectId === "all") {
            meetsHomeLanguage =
                typeof userSubjectsMap.get("home language") === "number" &&
                userSubjectsMap.get("home language") >= requiredPercent;
        } else if (required.subjectId) {
            const subjectName = idToName.get(required.subjectId)?.toLowerCase();
            meetsHomeLanguage =
                userSubjectsMap.get("home language subject") === subjectName &&
                userSubjectsMap.get("home language") >= requiredPercent;
        }
    }
    // Additional Language
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
                userSubjectsMap.get("additional language") >= requiredPercent;
        } else if (required.subjectId) {
            const subjectName = idToName.get(required.subjectId)?.toLowerCase();
            meetsAdditionalLanguage =
                userSubjectsMap.get("additional language subject") ===
                    subjectName &&
                userSubjectsMap.get("additional language") >= requiredPercent;
        }
    }
    // Extended logic: Check if student meets extended program criteria
    // Extended program rules:
    // 1. APS must meet the apsRequirementExtended (if specified), otherwise default to main APS - 1
    // 2. Can have UP TO 1 subject that is ONE LEVEL (10% band) below the required level
    // 3. Cannot have any subject more than one level below required (hard fail)
    //
    // Achievement levels: 7(80-100%), 6(70-79%), 5(60-69%), 4(50-59%), 3(40-49%), 2(30-39%), 1(0-29%)
    // "One level below" means: If required is 50% (level 4), can accept 40-49% (level 3)

    // Determine which extended APS requirement to use based on math subject
    const hasMath = userSubjectsMap.get("mathematics") > 0;
    const hasTechMath = userSubjectsMap.get("technical mathematics") > 0;
    const hasMathLit = userSubjectsMap.get("mathematical literacy") > 0;

    let extendedApsRequirement;
    if (
        hasMath &&
        course.apsRequirementExtendedMathematics !== undefined &&
        course.apsRequirementExtendedMathematics !== null
    ) {
        extendedApsRequirement = Number(
            course.apsRequirementExtendedMathematics
        );
    } else if (
        hasTechMath &&
        course.apsRequirementExtendedTechnicalMath !== undefined &&
        course.apsRequirementExtendedTechnicalMath !== null
    ) {
        extendedApsRequirement = Number(
            course.apsRequirementExtendedTechnicalMath
        );
    } else if (
        hasMathLit &&
        course.apsRequirementExtendedMathLit !== undefined &&
        course.apsRequirementExtendedMathLit !== null
    ) {
        extendedApsRequirement = Number(course.apsRequirementExtendedMathLit);
    } else if (
        course.apsRequirementExtended !== undefined &&
        course.apsRequirementExtended !== null
    ) {
        extendedApsRequirement = Number(course.apsRequirementExtended);
    } else {
        // Default: mainstream APS - 1
        let mainAps = course.apsRequirement || 0;
        if (hasMath && course.apsRequirementMathematics)
            mainAps = course.apsRequirementMathematics;
        else if (hasTechMath && course.apsRequirementTechnicalMath)
            mainAps = course.apsRequirementTechnicalMath;
        else if (hasMathLit && course.apsRequirementMathLit)
            mainAps = course.apsRequirementMathLit;
        extendedApsRequirement = Math.max(0, mainAps - 1);
    }

    // console.log(`[WSU EXTENDED DEBUG] Extended APS requirement determined:`, {
    //     hasMath,
    //     hasTechMath,
    //     hasMathLit,
    //     extendedApsRequirement,
    //     apsRequirementExtendedMathematics:
    //         course.apsRequirementExtendedMathematics,
    //     apsRequirementExtendedTechnicalMath:
    //         course.apsRequirementExtendedTechnicalMath,
    //     apsRequirementExtendedMathLit: course.apsRequirementExtendedMathLit,
    //     apsRequirementExtended: course.apsRequirementExtended,
    // });

    // Helper to get achievement level from percentage
    const getAchievementLevel = (percent) => {
        if (percent >= 80) return 7;
        if (percent >= 70) return 6;
        if (percent >= 60) return 5;
        if (percent >= 50) return 4;
        if (percent >= 40) return 3;
        if (percent >= 30) return 2;
        return 1;
    };

    let nearMissCount = 0; // Subjects that are exactly 1 level below requirement
    let hardFailCount = 0; // Subjects that are more than 1 level below requirement
    const subjectRequirements = course.subjectRequirements || [];

    // DEBUG: Log subject requirement details
    // console.log(
    //     `[WSU EXTENDED DEBUG] Checking subject requirements for ${course.courseName}:`
    // );
    const reqDetails = [];

    for (const req of subjectRequirements) {
        // Skip special placeholders
        if (isSpecialPlaceholder(req.subjectId)) continue;

        // Skip if this subject was already used in a group requirement
        if (subjectsUsedInGroups.has(req.subjectId)) {
            // console.log(
            //     `[WSU EXTENDED DEBUG] Skipping ${req.subjectId} - already used in group requirement`
            // );
            continue;
        }

        const subjectName = idToName.get(req.subjectId)?.toLowerCase();
        const userPercent = Number(userSubjectsMap.get(subjectName) || 0);
        const requiredPercent = Number(req.percentage || 0);

        const userLevel = getAchievementLevel(userPercent);
        const requiredLevel = getAchievementLevel(requiredPercent);
        const levelDifference = requiredLevel - userLevel;

        reqDetails.push({
            subjectId: req.subjectId,
            subjectName: subjectName || "NOT FOUND",
            requiredPercent,
            userPercent,
            requiredLevel,
            userLevel,
            levelDifference,
            meets: userPercent >= requiredPercent,
            nearMiss: levelDifference === 1, // Exactly 1 level below
            hardFail: levelDifference > 1, // More than 1 level below
        });

        // If user meets or exceeds requirement, continue
        if (userPercent >= requiredPercent) continue;

        // If user is exactly one level below requirement, it's a near miss
        if (levelDifference === 1) {
            nearMissCount += 1;
        } else if (levelDifference > 1) {
            // More than one level below = hard fail
            hardFailCount += 1;
        }
    }

    // console.log(
    //     `[WSU EXTENDED DEBUG] Subject requirements breakdown:`,
    //     reqDetails
    // );
    // console.log(
    //     `[WSU EXTENDED DEBUG] Available user subjects in map:`,
    //     Array.from(userSubjectsMap.entries())
    // );

    const meetsExtendedAps = aps >= extendedApsRequirement;

    let meetsAdditionalSubjects = true;
    if (course.numAdditionalSubjects && course.totalApsForAdditionalSubjects) {
        // Build set of used subject IDs from requirements
        const usedSubjectIds = new Set();
        (course.subjectRequirements || []).forEach((req) =>
            usedSubjectIds.add(req.subjectId)
        );
        if (
            course.homeLanguageRequirement &&
            course.homeLanguageRequirement.subjectId &&
            course.homeLanguageRequirement.subjectId !== "all"
        )
            usedSubjectIds.add(course.homeLanguageRequirement.subjectId);
        if (
            course.additionalLanguageRequirement &&
            course.additionalLanguageRequirement.subjectId &&
            course.additionalLanguageRequirement.subjectId !== "all"
        )
            usedSubjectIds.add(course.additionalLanguageRequirement.subjectId);
        meetsAdditionalSubjects = hasNAdditionalSubjectsTotalling(
            course.numAdditionalSubjects,
            course.totalApsForAdditionalSubjects,
            userSubjectsMap,
            idToName,
            usedSubjectIds,
            course.allowLifeOrientation || false
        );
    }
    const meetsExtendedRequirements =
        meetsExtendedAps &&
        meetsGroups &&
        meetsHomeLanguage &&
        meetsAdditionalLanguage &&
        hardFailCount === 0 && // No hard fails
        nearMissCount <= 1 && // At most 1 subject can be 10% lower
        meetsAdditionalSubjects;

    // console.log(`[WSU EXTENDED] ${course.courseName}:`, {
    //     aps,
    //     extendedApsRequirement,
    //     meetsExtendedAps,
    //     meetsGroups,
    //     meetsHomeLanguage,
    //     meetsAdditionalLanguage,
    //     nearMissCount,
    //     hardFailCount,
    //     meetsExtendedRequirements,
    // });

    return meetsExtendedRequirements;
}
export const meta = {
    code: "wsu",
    displayName: "Walter Sisulu University",
    collections: ["wsu"],
    mathSubjects: [
        "682320f89c61006b5937180c", // Mathematics
        "682346d7af0e046517c46da6", // Mathematical Literacy
        "68234b52af0e046517c46df4", // Technical Mathematics
    ],
};

export function calculateAPS(data) {
    function percentToAps(percent) {
        if (percent >= 90) return 8; // 90–100% = 8
        if (percent >= 80) return 7; // 80–100% = 7
        if (percent >= 70) return 6;
        if (percent >= 60) return 5;
        if (percent >= 50) return 4;
        if (percent >= 40) return 3;
        if (percent >= 30) return 2;
        return 1;
    }
    // Build entries with tags so we can enforce inclusion of language(s) and math
    const entries = [];

    // Home Language
    if (data.homeLanguage && !/life orientation/i.test(data.homeLanguage)) {
        entries.push({
            name: (data.homeLanguage || "").toLowerCase(),
            percent: Number(data.homeLanguagePercent || 0),
            tag: "homeLang",
        });
    }

    // Additional Language
    if (
        data.additionalLanguage &&
        !/life orientation/i.test(data.additionalLanguage)
    ) {
        entries.push({
            name: (data.additionalLanguage || "").toLowerCase(),
            percent: Number(data.additionalLanguagePercent || 0),
            tag: "addLang",
        });
    }

    // Mathematics (best of the three, but only count once)
    const mathSubjects = [
        {
            name: data.mathSubject || "mathematics",
            percent: Number(data.mathPercent || 0),
            tag: "math",
        },
        {
            name: data.technicalMathSubject || "technical mathematics",
            percent: Number(data.technicalMathPercent || 0),
            tag: "math",
        },
        {
            name: data.mathLitSubject || "mathematical literacy",
            percent: Number(data.mathLitPercent || 0),
            tag: "math",
        },
    ];
    const bestMath = mathSubjects
        .filter((s) => s.name && !/life orientation/i.test(s.name))
        .reduce((best, s) => (s.percent > (best.percent || 0) ? s : best), {
            percent: 0,
        });
    if (bestMath.percent > 0) {
        entries.push({
            name: (bestMath.name || "").toLowerCase(),
            percent: bestMath.percent,
            tag: "math",
        });
    }

    // Other Subjects (excluding Life Orientation)
    (data.otherSubjects || []).forEach((subject) => {
        if (subject.subject && !/life orientation/i.test(subject.subject)) {
            entries.push({
                name: (subject.subject || "").toLowerCase(),
                percent: Number(subject.percent || 0),
                tag: "other",
            });
        }
    });

    // Sort and pick top 6
    let sorted = entries.slice().sort((a, b) => b.percent - a.percent);
    let top = sorted.slice(0, 6);

    // Ensure presence of required tags: homeLang and math; include addLang if present in input
    const requiredTags = [];
    if (entries.some((e) => e.tag === "homeLang"))
        requiredTags.push("homeLang");
    if (entries.some((e) => e.tag === "addLang")) requiredTags.push("addLang");
    if (entries.some((e) => e.tag === "math")) requiredTags.push("math");

    const hasTag = (tag) => top.some((e) => e.tag === tag);
    for (const tag of requiredTags) {
        if (!hasTag(tag)) {
            const requiredEntry = sorted.find((e) => e.tag === tag);
            if (requiredEntry) {
                // replace lowest non-required entry in top
                let replaceIdx = -1;
                for (let i = top.length - 1; i >= 0; i--) {
                    if (!requiredTags.includes(top[i].tag)) {
                        replaceIdx = i;
                        break;
                    }
                }
                if (replaceIdx === -1 && top.length < 6)
                    top.push(requiredEntry);
                else if (replaceIdx !== -1) top[replaceIdx] = requiredEntry;
                top = top.sort((a, b) => b.percent - a.percent);
            }
        }
    }

    // Calculate APS for top selected subjects
    let totalAPS = top.reduce((sum, e) => sum + percentToAps(e.percent), 0);

    // console.log(`WSU APS Score:  ${totalAPS}`);
    return { aps: totalAPS };
}

export function getQualifiedCourses({
    aps,
    userSubjectsMap,
    courses,
    idToName,
    mathSubjects = meta.mathSubjects,
}) {
    const results = [];

    courses.forEach((course) => {
        // console.log(`[WSU REPORT] Processing course: ${course.courseName}`);

        // Check mainstream eligibility
        const mainstream = isMainstreamEligible({
            aps,
            userSubjectsMap,
            course,
            idToName,
            mathSubjects,
        });

        // Check extended eligibility
        const extended = isExtendedEligible({
            aps,
            userSubjectsMap,
            course,
            idToName,
            mathSubjects,
        });

        // Helper function to create course result object
        const createCourseResult = (courseData, qualificationType) => ({
            name: courseData.courseName,
            code: courseData.courseCode,
            apsRequirement: courseData.apsRequirement,
            apsRequirementMathematics: courseData.apsRequirementMathematics,
            apsRequirementMathLit: courseData.apsRequirementMathLit,
            apsRequirementTechnicalMath: courseData.apsRequirementTechnicalMath,
            methodOfStudy: courseData.methodOfStudy,
            majoring: courseData.majoring,
            duration: courseData.duration,
            careerChoices: courseData.careerChoices,
            campuses: courseData.campuses,
            requirements: courseData.subjectRequirements?.map((req) => ({
                subject: idToName.get(req.subjectId) || "Unknown Subject",
                required: req.percentage,
            })),
            requirementGroups: courseData.subjectRequirementGroups?.map(
                (group) =>
                    group.map((req) => ({
                        subject:
                            idToName.get(req.subjectId) || "Unknown Subject",
                        required: req.percentage,
                    }))
            ),
            homeLanguageRequirement: courseData.homeLanguageRequirement
                ? {
                      subject:
                          courseData.homeLanguageRequirement.subjectId === "all"
                              ? "All Languages"
                              : idToName.get(
                                    courseData.homeLanguageRequirement.subjectId
                                ) || "Unknown Subject",
                      percentage: courseData.homeLanguageRequirement.percentage,
                  }
                : null,
            additionalLanguageRequirement:
                courseData.additionalLanguageRequirement
                    ? {
                          subject:
                              courseData.additionalLanguageRequirement
                                  .subjectId === "all"
                                  ? "All Languages"
                                  : idToName.get(
                                        courseData.additionalLanguageRequirement
                                            .subjectId
                                    ) || "Unknown Subject",
                          percentage:
                              courseData.additionalLanguageRequirement
                                  .percentage,
                      }
                    : null,
            qualificationType,
        });

        // If user qualifies for mainstream, add the main course
        if (mainstream) {
            // console.log(
            //     `[WSU REPORT] Qualified for MAINSTREAM: ${course.courseName}`
            // );
            results.push(createCourseResult(course, "Mainstream"));
        }
        // If user qualifies for extended program
        else if (extended && course.hasExtended) {
            // console.log(
            //     `[WSU REPORT] Qualified for EXTENDED PROGRAMME: ${course.courseName}`
            // );

            // Helper to reduce APS by 1 (minimum 0)
            const reduceAPS = (aps) => (aps ? Math.max(0, aps - 1) : aps);

            // Helper to increment course code (W001 -> W002, W0009 -> W0010)
            const incrementCourseCode = (code) => {
                if (!code) return code;
                const match = code.match(/^([A-Za-z]+)(\d+)$/);
                if (match) {
                    const prefix = match[1];
                    const number = parseInt(match[2], 10);
                    const newNumber = number + 1;
                    // Preserve the zero-padding length
                    const paddedNumber = String(newNumber).padStart(
                        match[2].length,
                        "0"
                    );
                    return prefix + paddedNumber;
                }
                return code; // Return unchanged if pattern doesn't match
            };

            // Helper to increment duration (3 years -> 4 years, 8 years -> 9 years)
            const incrementDuration = (duration) => {
                if (!duration) return duration;
                const match = duration.match(/^(\d+)\s*(year[s]?|yr[s]?)$/i);
                if (match) {
                    const years = parseInt(match[1], 10);
                    const unit = match[2];
                    return `${years + 1} ${unit}`;
                }
                return duration; // Return unchanged if pattern doesn't match
            };

            // Determine extended APS based on math subject
            const hasMath = userSubjectsMap.get("mathematics") > 0;
            const hasTechMath =
                userSubjectsMap.get("technical mathematics") > 0;
            const hasMathLit = userSubjectsMap.get("mathematical literacy") > 0;

            const getExtendedAps = (mathSpecificExtended, mathSpecificMain) => {
                // Priority 1: Use math-specific extended APS if defined
                if (
                    mathSpecificExtended !== undefined &&
                    mathSpecificExtended !== null
                ) {
                    return mathSpecificExtended;
                }
                // Priority 2: Use default extended APS if defined
                if (
                    course.apsRequirementExtended !== undefined &&
                    course.apsRequirementExtended !== null
                ) {
                    return course.apsRequirementExtended;
                }
                // Priority 3: Calculate as math-specific main APS - 1
                if (mathSpecificMain) {
                    return reduceAPS(mathSpecificMain);
                }
                // Priority 4: Use main APS - 1 as fallback
                return reduceAPS(course.apsRequirement);
            };

            // Generate extended course dynamically with the specified extended APS requirements
            const extendedCourse = {
                ...course,
                courseName: course.courseName + " (ECP)",
                courseCode: incrementCourseCode(course.courseCode),
                duration: incrementDuration(course.duration),
                // Default APS requirement (shown when no math subject specified in UI)
                apsRequirement: getExtendedAps(
                    course.apsRequirementExtended,
                    course.apsRequirement
                ),
                // APS with Mathematics
                apsRequirementMathematics: hasMath
                    ? getExtendedAps(
                          course.apsRequirementExtendedMathematics,
                          course.apsRequirementMathematics
                      )
                    : getExtendedAps(
                          course.apsRequirementExtendedMathematics ||
                              course.apsRequirementExtended,
                          course.apsRequirementMathematics
                      ),
                // APS with Math Literacy
                apsRequirementMathLit: hasMathLit
                    ? getExtendedAps(
                          course.apsRequirementExtendedMathLit,
                          course.apsRequirementMathLit
                      )
                    : getExtendedAps(
                          course.apsRequirementExtendedMathLit ||
                              course.apsRequirementExtended,
                          course.apsRequirementMathLit
                      ),
                // APS with Technical Mathematics
                apsRequirementTechnicalMath: hasTechMath
                    ? getExtendedAps(
                          course.apsRequirementExtendedTechnicalMath,
                          course.apsRequirementTechnicalMath
                      )
                    : getExtendedAps(
                          course.apsRequirementExtendedTechnicalMath ||
                              course.apsRequirementExtended,
                          course.apsRequirementTechnicalMath
                      ),
            };

            results.push(
                createCourseResult(extendedCourse, "Extended Programme")
            );
        } else {
            // console.log(`[WSU REPORT] Does NOT qualify: ${course.courseName}`);
        }
    });

    return results;
}
