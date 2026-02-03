export const meta = {
    code: "smu",
    displayName: "Sefako Makgatho Health Sciences University",
    collections: ["smu"],
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
        return 1;
    }

    // Home Language
    totalAPS += percentToAps(data.homeLanguagePercent || 0);

    // Additional Language
    totalAPS += percentToAps(data.additionalLanguagePercent || 0);

    // Mathematics (highest qualifying subject)
    const mathScore = Math.max(
        data.mathPercent || 0,
        data.technicalMathPercent || 0,
        data.mathLitPercent || 0
    );
    totalAPS += percentToAps(mathScore);

    // Explicitly include Life Orientation (if present) and then include
    // the remaining other subjects (excluding Life Orientation to avoid
    // double-counting). Older/varied payloads sometimes include LO as a
    // top-level percent (e.g. `lifeOrientationPercent: 60`) instead of an
    // entry in `otherSubjects`. Support both shapes.
    const otherSubjects = Array.isArray(data.otherSubjects)
        ? data.otherSubjects
        : [];

    // Try to find LO inside otherSubjects first
    const lifeOrientation = otherSubjects.find((s) =>
        /life orientation/i.test(s.subject || "")
    );

    // Fallbacks for legacy/top-level LO percent shapes
    const fallbackLoPercent =
        typeof data.lifeOrientationPercent === "number"
            ? data.lifeOrientationPercent
            : data.lifeOrientation &&
              typeof data.lifeOrientation.percent === "number"
            ? data.lifeOrientation.percent
            : null;

    const loPercent = lifeOrientation
        ? lifeOrientation.percent || 0
        : fallbackLoPercent;

    if (typeof loPercent === "number" && loPercent !== null) {
        totalAPS += percentToAps(loPercent || 0);
    }

    otherSubjects.forEach((subject) => {
        if (!/life orientation/i.test(subject.subject || "")) {
            totalAPS += percentToAps(subject.percent || 0);
        }
    });

    console.log(`SMU Aps Score:  ${totalAPS}`);
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
                    //     `Checking MATH Subject: ${subject} | Required: ${req.percentage} | User: ${userPercent}`
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

            // --- Home Language Requirement ---
            // Allow the language requirement to be satisfied by either the
            // user's home language OR their additional language. If the course
            // requires "all" languages, check numeric percents for both and
            // pass if either meets the threshold. If a specific language is
            // selected, check whether either the user's home or additional
            // language subject matches that language and that their percent
            // meets the required percent.
            let meetsHomeLanguage = true;
            if (
                course.homeLanguageRequirement &&
                course.homeLanguageRequirement.percentage !== undefined
            ) {
                const required = course.homeLanguageRequirement;
                const requiredPercent = Number(required.percentage);

                if (required.subjectId === "all") {
                    const homePerc = userSubjectsMap.get("home language");
                    const addPerc = userSubjectsMap.get("additional language");
                    meetsHomeLanguage =
                        (typeof homePerc === "number" &&
                            homePerc >= requiredPercent) ||
                        (typeof addPerc === "number" &&
                            addPerc >= requiredPercent);
                } else if (required.subjectId) {
                    const subjectName = idToName
                        .get(required.subjectId)
                        ?.toLowerCase();
                    const homeMatches =
                        userSubjectsMap.get("home language subject") ===
                            subjectName &&
                        (userSubjectsMap.get("home language") || 0) >=
                            requiredPercent;
                    const addMatches =
                        userSubjectsMap.get("additional language subject") ===
                            subjectName &&
                        (userSubjectsMap.get("additional language") || 0) >=
                            requiredPercent;
                    meetsHomeLanguage = homeMatches || addMatches;
                }
            }

            // --- Additional Language Requirement ---
            // Same behavior as home language requirement: allow either user
            // language to satisfy the named requirement.
            let meetsAdditionalLanguage = true;
            if (
                course.additionalLanguageRequirement &&
                course.additionalLanguageRequirement.percentage !== undefined
            ) {
                const required = course.additionalLanguageRequirement;
                const requiredPercent = Number(required.percentage);

                if (required.subjectId === "all") {
                    const homePerc = userSubjectsMap.get("home language");
                    const addPerc = userSubjectsMap.get("additional language");
                    meetsAdditionalLanguage =
                        (typeof homePerc === "number" &&
                            homePerc >= requiredPercent) ||
                        (typeof addPerc === "number" &&
                            addPerc >= requiredPercent);
                } else if (required.subjectId) {
                    const subjectName = idToName
                        .get(required.subjectId)
                        ?.toLowerCase();
                    const homeMatches =
                        userSubjectsMap.get("home language subject") ===
                            subjectName &&
                        (userSubjectsMap.get("home language") || 0) >=
                            requiredPercent;
                    const addMatches =
                        userSubjectsMap.get("additional language subject") ===
                            subjectName &&
                        (userSubjectsMap.get("additional language") || 0) >=
                            requiredPercent;
                    meetsAdditionalLanguage = homeMatches || addMatches;
                }
            }

            // --- Additional Requirements (choose N remaining subjects at a required APS level) ---
            let meetsAdditionalRequirements = true;
            if (
                Array.isArray(course.additionalRequirements) &&
                course.additionalRequirements.length
            ) {
                // collect excluded subject names from subjectRequirements and groups
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

                // build remaining user subjects (exclude language helper keys and excluded subjects)
                const skipKeys = new Set([
                    "home language",
                    "home language subject",
                    "additional language",
                    "additional language subject",
                ]);
                const remaining = [];
                for (const [subj, perc] of userSubjectsMap.entries()) {
                    if (skipKeys.has(subj)) continue;
                    if (excluded.has(subj)) continue;
                    // subj is a subject name
                    remaining.push({
                        subject: subj,
                        percent: Number(perc) || 0,
                    });
                }

                function percentToApsLocal(percent) {
                    if (percent >= 80) return 7;
                    if (percent >= 70) return 6;
                    if (percent >= 60) return 5;
                    if (percent >= 50) return 4;
                    if (percent >= 40) return 3;
                    if (percent >= 30) return 2;
                    return 1;
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

            const finalDecision =
                aps >= requiredAPS &&
                meetsMath &&
                meetsOther &&
                meetsGroups &&
                meetsHomeLanguage &&
                meetsAdditionalLanguage &&
                meetsAdditionalRequirements;

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
            additionalRequirements:
                course.additionalRequirements?.map((r) => ({
                    count: r.count,
                    level: r.level,
                })) || [],
        }));
}
