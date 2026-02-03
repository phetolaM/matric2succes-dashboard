// apsLogic/universities/MUT.js
export const meta = {
    code: "mut",
    displayName: "Mangosuthu University of Technology",
    collections: ["mut"],
    mathSubjects: [
        "682320f89c61006b5937180c", // Mathematics
        "682346d7af0e046517c46da6", // Mathematical Literacy
        "68234b52af0e046517c46df4", // Technical Mathematics
    ],
};

export function calculateAPS(data) {
    // Map percent to APS using MUT scale
    function percentToAps(percent) {
        if (percent >= 90) return 8;
        if (percent >= 80) return 7;
        if (percent >= 70) return 6;
        if (percent >= 60) return 5;
        if (percent >= 50) return 4;
        if (percent >= 40) return 3;
        return 0; // Below 40% contributes 0 points
    }

    // Collect unique subjects (by normalized name) excluding Life Orientation
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

    // Home and additional languages
    pushIfBetter(data.homeLanguage, data.homeLanguagePercent);
    pushIfBetter(data.additionalLanguage, data.additionalLanguagePercent);

    // Best mathematics among candidates
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

    // Other subjects
    (data.otherSubjects || [])
        .filter((s) => s && s.subject)
        .forEach((s) => {
            const name = s.subject;
            if (/life orientation/i.test(name)) return;
            // Exclude math-like duplicates
            if (
                /mathematics/i.test(name.toLowerCase()) ||
                /technical mathematics/i.test(name.toLowerCase()) ||
                /mathematical literacy/i.test(name.toLowerCase())
            )
                return;
            const home = (data.homeLanguage || "").toString().toLowerCase();
            const add = (data.additionalLanguage || "")
                .toString()
                .toLowerCase();
            if (name.toLowerCase() === home || name.toLowerCase() === add)
                return;
            pushIfBetter(name, s.percent);
        });

    // Pick best 6 subjects by percent
    const all = Array.from(seen.entries()).map(([name, percent]) => ({
        name,
        percent,
    }));
    const best6 = all.sort((a, b) => b.percent - a.percent).slice(0, 6);

    // Sum APS for best 6
    const totalAPS = best6.reduce(
        (sum, s) => sum + percentToAps(Number(s.percent || 0)),
        0
    );

    console.log("MUT APS: ", totalAPS);
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
            // APS Requirements
            const hasMath = userSubjectsMap.get("mathematics") > 0;
            const hasMathLit = userSubjectsMap.get("mathematical literacy") > 0;
            const hasTechMath =
                userSubjectsMap.get("technical mathematics") > 0;

            let requiredAPS = course.apsRequirement;
            if (hasMath && course.apsRequirementMathematics) {
                requiredAPS = course.apsRequirementMathematics;
            } else if (hasMathLit && course.apsRequirementMathLit) {
                requiredAPS = course.apsRequirementMathLit;
            } else if (hasTechMath && course.apsRequirementTechnicalMath) {
                requiredAPS = course.apsRequirementTechnicalMath;
            }

            // If a required APS is specified (finite number), enforce it.
            // If no APS requirement is provided for this course, skip APS
            // comparison and rely on subject/language/group requirements.
            if (Number.isFinite(requiredAPS)) {
                if ((typeof aps === "number" ? aps : Number(aps)) < requiredAPS)
                    return false;
            }

            // --- Helper: map small numeric 'level' values (1-7) to an approximate percent threshold ---
            const levelToPercent = (lvl) => {
                const map = {
                    7: 80,
                    6: 70,
                    5: 60,
                    4: 50,
                    3: 40,
                    2: 30,
                    1: 20,
                };
                const n = Number(lvl);
                if (map[n] !== undefined) return map[n];
                if (!Number.isNaN(n) && n > 0) return n;
                return 0;
            };

            // Access/Diploma preliminary subject-count checks
            // If this course is marked as an access course, require 6 subjects
            // at minimum level 3 (mapped to percent). Otherwise require 5
            // subjects at minimum level 4.
            const excludedKeys = new Set([
                "home language",
                "additional language",
                "home language subject",
                "additional language subject",
                "life orientation",
            ]);
            const userSubjectPercents = [...userSubjectsMap.entries()].filter(
                ([k, v]) => !excludedKeys.has(k)
            );

            if (course.accessCourse) {
                const minPercent = levelToPercent(3);
                const count = userSubjectPercents.reduce(
                    (acc, [, v]) => acc + ((v || 0) >= minPercent ? 1 : 0),
                    0
                );
                if (count < 6) return false;
            } else {
                const minPercent = levelToPercent(4);
                const count = userSubjectPercents.reduce(
                    (acc, [, v]) => acc + ((v || 0) >= minPercent ? 1 : 0),
                    0
                );
                if (count < 5) return false;
            }

            // Subject Requirements
            const mathReqs =
                course.subjectRequirements?.filter((req) =>
                    mathSubjects.includes(req.subjectId)
                ) || [];

            const meetsMath =
                mathReqs.length === 0 ||
                mathReqs.some((req) => {
                    const subject = idToName.get(req.subjectId)?.toLowerCase();
                    return (
                        (userSubjectsMap.get(subject) || 0) >= req.percentage
                    );
                });

            const otherReqs =
                course.subjectRequirements?.filter(
                    (req) => !mathSubjects.includes(req.subjectId)
                ) || [];

            const meetsOther =
                otherReqs.length === 0 ||
                otherReqs.every((req) => {
                    const subject = idToName.get(req.subjectId)?.toLowerCase();
                    return (
                        (userSubjectsMap.get(subject) || 0) >= req.percentage
                    );
                });

            const meetsGroups =
                !course.subjectRequirementGroups?.length ||
                course.subjectRequirementGroups.every((group) =>
                    group.some((req) => {
                        const subject = idToName
                            .get(req.subjectId)
                            ?.toLowerCase();
                        return (
                            (userSubjectsMap.get(subject) || 0) >=
                            req.percentage
                        );
                    })
                );

            // --- Subject Combination Groups ---
            // New feature: allow admins to define combinations like
            // [ {A_level, B_level}, OR {C_level, D_level} ] where each
            // inner array must ALL be met (AND) and the outer array is OR.
            // If `subjectCombinationGroups` is present, require that at
            // least one combination is fully satisfied by the user.
            const combinationGroups = course.subjectCombinationGroups || [];
            const meetsCombination =
                !combinationGroups.length ||
                combinationGroups.some(
                    (combo) =>
                        Array.isArray(combo) &&
                        combo.every((req) => {
                            const subject = idToName
                                .get(req.subjectId)
                                ?.toLowerCase();
                            return (
                                (userSubjectsMap.get(subject) || 0) >=
                                req.percentage
                            );
                        })
                );

            // --- Additional Requirements (choose N remaining subjects at a required APS level)
            let meetsAdditionalRequirements = true;
            if (
                Array.isArray(course.additionalRequirements) &&
                course.additionalRequirements.length
            ) {
                // collect excluded subject names from subjectRequirements, groups and combination groups
                const excluded = new Set();
                (course.subjectRequirements || []).forEach((r) => {
                    const name = idToName.get(r.subjectId)?.toLowerCase();
                    if (name) excluded.add(name);
                });
                (course.subjectRequirementGroups || []).forEach((group) => {
                    (group || []).forEach((r) => {
                        const name = idToName.get(r.subjectId)?.toLowerCase();
                        if (name) excluded.add(name);
                    });
                });
                (course.subjectCombinationGroups || []).forEach((group) => {
                    (group || []).forEach((r) => {
                        const name = idToName.get(r.subjectId)?.toLowerCase();
                        if (name) excluded.add(name);
                    });
                });

                // build remaining user subjects (exclude language helper keys, excluded subjects and Life Orientation)
                const skipKeys = new Set([
                    "home language",
                    "home language subject",
                    "additional language",
                    "additional language subject",
                    "life orientation",
                ]);
                const remaining = [];
                for (const [subj, perc] of userSubjectsMap.entries()) {
                    if (skipKeys.has(subj)) continue;
                    if (excluded.has(subj)) continue;
                    remaining.push({
                        subject: subj,
                        percent: Number(perc) || 0,
                    });
                }

                function percentToApsLocal(percent) {
                    if (percent >= 90) return 8;
                    if (percent >= 80) return 7;
                    if (percent >= 70) return 6;
                    if (percent >= 60) return 5;
                    if (percent >= 50) return 4;
                    if (percent >= 40) return 3;
                    return 0;
                }

                // Apply additional requirements sequentially and consume chosen subjects
                // so the same subject cannot be used to satisfy multiple additional requirements.
                let remainingSubjects = remaining
                    .slice()
                    .sort((a, b) => Number(b.percent) - Number(a.percent));
                meetsAdditionalRequirements = true;
                for (const req of course.additionalRequirements) {
                    const need = Number(req.count) || 0;
                    const level = Number(req.level) || 0;
                    if (!need || !level) continue; // ignore malformed entries

                    // find subjects in the remaining pool that meet the APS level
                    const qualifying = remainingSubjects.filter(
                        (s) => percentToApsLocal(s.percent) >= level
                    );

                    if (qualifying.length < need) {
                        meetsAdditionalRequirements = false;
                        break;
                    }

                    // consume the top `need` qualifying subjects so they can't be reused
                    const chosen = qualifying
                        .slice(0, need)
                        .map((s) => s.subject);
                    remainingSubjects = remainingSubjects.filter(
                        (s) => !chosen.includes(s.subject)
                    );
                }
            }

            // --- Home Language Requirement ---
            let meetsHomeLanguage = false;
            let hasHomeRequirement = false;
            if (
                course.homeLanguageRequirement &&
                course.homeLanguageRequirement.percentage !== undefined &&
                course.homeLanguageRequirement.percentage !== null
            ) {
                hasHomeRequirement = true;
                const required = course.homeLanguageRequirement;
                let requiredPercent = Number(required.percentage);
                // If admin saved a small integer (<=7) treat it as a level
                if (
                    !Number.isNaN(requiredPercent) &&
                    requiredPercent > 0 &&
                    requiredPercent <= 7
                ) {
                    requiredPercent = levelToPercent(requiredPercent);
                }

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
                        (userSubjectsMap.get(subjectName) || 0) >=
                        requiredPercent;
                }
            }

            // --- Additional Language Requirement ---
            let meetsAdditionalLanguage = false;
            let hasAdditionalRequirement = false;
            if (
                course.additionalLanguageRequirement &&
                course.additionalLanguageRequirement.percentage !== undefined &&
                course.additionalLanguageRequirement.percentage !== null
            ) {
                hasAdditionalRequirement = true;
                const required = course.additionalLanguageRequirement;
                let requiredPercent = Number(required.percentage);
                if (
                    meetsAdditionalRequirements &&
                    !Number.isNaN(requiredPercent) &&
                    requiredPercent > 0 &&
                    requiredPercent <= 7
                ) {
                    requiredPercent = levelToPercent(requiredPercent);
                }

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
                        (userSubjectsMap.get(subjectName) || 0) >=
                        requiredPercent;
                }
            }

            // Evaluate language requirement semantics depending on operator
            // If both requirements exist and admin set operator to 'either',
            // then passing either suffices. Otherwise require both when both
            // are present. If only one side is present, enforce that side.
            const operator = course.languageRequirementOperator || "both";
            let languageOk = true;
            if (hasHomeRequirement && hasAdditionalRequirement) {
                if (operator === "either") {
                    languageOk = meetsHomeLanguage || meetsAdditionalLanguage;
                } else {
                    languageOk = meetsHomeLanguage && meetsAdditionalLanguage;
                }
            } else if (hasHomeRequirement) {
                languageOk = meetsHomeLanguage;
            } else if (hasAdditionalRequirement) {
                languageOk = meetsAdditionalLanguage;
            } else {
                languageOk = true;
            }

            return (
                meetsMath &&
                meetsOther &&
                meetsGroups &&
                meetsCombination &&
                languageOk
            );
        })
        .map((course) => ({
            name: course.courseName,
            code: course.courseCode,
            apsRequirement: course.apsRequirement,
            apsRequirementMathematics: course.apsRequirementMathematics,
            apsRequirementMathLit: course.apsRequirementMathLit,
            apsRequirementTechnicalMath: course.apsRequirementTechnicalMath,
            duration: course.duration,
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
            careerChoices: course.careerChoices,
            accessCourse: !!course.accessCourse,
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
