// apsLogic/universities/NMU.js
export const meta = {
    code: "nmu",
    displayName: "Nelson Mandela University",
    collections: ["nmu"],
    mathSubjects: [
        "682320f89c61006b5937180c", // Mathematics
        "682346d7af0e046517c46da6", // Mathematical Literacy
        "68234b52af0e046517c46df4", // Technical Mathematics
    ],
};

export function calculateAPS(data) {
    // 1. Gather all academic subjects (exclude Life Orientation) and normalize percents
    const candidates = [
        { subject: data.homeLanguage, percent: data.homeLanguagePercent },
        {
            subject: data.additionalLanguage,
            percent: data.additionalLanguagePercent,
        },
        { subject: data.mathSubject, percent: data.mathPercent },
        { subject: data.mathLitSubject, percent: data.mathLitPercent },
        {
            subject: data.technicalMathSubject,
            percent: data.technicalMathPercent,
        },
        ...(Array.isArray(data.otherSubjects) ? data.otherSubjects : []),
    ];

    const academicSubjects = candidates
        .filter((s) => s && s.subject)
        .map((s) => ({ subject: s.subject, percent: Number(s.percent) }))
        .filter(
            (s) =>
                !/life orientation/i.test(s.subject) && !Number.isNaN(s.percent)
        );

    // 2. Collect percents
    const percents = academicSubjects.map((s) => s.percent);

    // 3. If user has exactly 6 academic subjects (this usually means 7 subjects including LO),
    //    sum all of them. If user has more than 6 academic subjects, sum the best 6.
    let chosen = [];
    if (percents.length <= 6) {
        chosen = percents.slice();
    } else {
        chosen = percents
            .slice()
            .sort((a, b) => b - a)
            .slice(0, 6);
    }

    // 4. APS for NMU is the sum of the chosen subject percentages (LO excluded)
    const aps = chosen.reduce((sum, v) => sum + v, 0);

    // return numeric APS (sum of percentages)
    return { aps };
}

export function getQualifiedCourses({
    aps,
    userSubjectsMap,
    courses,
    idToName,
    mathSubjects = meta.mathSubjects,
}) {
    // Evaluate user's general qualification level (higher certificate < diploma < bachelor)
    function evaluateUserGeneralLevel(userSubjectsMap = new Map()) {
        const normalize = (s) => (s || "").toString().toLowerCase().trim();

        const get = (key) => {
            const v = userSubjectsMap.get(key);
            return typeof v === "number" ? v : Number(v || 0);
        };

        const homeLang = get("home language");
        const addLang = get("additional language");

        const others = [];
        const allSubjects = [];
        for (const [k, v] of userSubjectsMap.entries()) {
            const key = (k || "").toString();
            if (!key) continue;
            if (key.toLowerCase().includes("subject")) continue;
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

        const passCount = allSubjects.filter(
            (p) => Number(p || 0) >= 30
        ).length;

        const hc_ok =
            homeLang >= 40 &&
            countAtLeast(40) >= 2 &&
            countAtLeast(30) >= 4 &&
            passCount >= 6;

        const diploma_ok =
            homeLang >= 40 &&
            countAtLeast(40) >= 3 &&
            addLang >= 30 &&
            passCount >= 6;

        const degree_ok =
            homeLang >= 40 &&
            countAtLeast(50) >= 4 &&
            addLang >= 30 &&
            countAtLeast(30) >= 1 &&
            passCount >= 6;

        if (degree_ok) return "bachelor";
        if (diploma_ok) return "diploma";
        if (hc_ok) return "higher certificate";
        return null;
    }

    const userGeneralLevel = evaluateUserGeneralLevel(userSubjectsMap);
    const levelRank = { "higher certificate": 1, diploma: 2, bachelor: 3 };
    return courses
        .filter((course) => {
            // APS requirement check
            const hasMath = userSubjectsMap.get("mathematics") > 0;
            const hasMathLit = userSubjectsMap.get("mathematical literacy") > 0;
            const hasTechMath =
                userSubjectsMap.get("technical mathematics") > 0;

            const hasAnyMathAPS =
                course.apsRequirementMathematics ||
                course.apsRequirementMathLit ||
                course.apsRequirementTechnicalMath;

            let requiredAPS = course.apsRequirement;

            if (hasAnyMathAPS) {
                if (hasMath && course.apsRequirementMathematics) {
                    requiredAPS = course.apsRequirementMathematics;
                } else if (hasMathLit && course.apsRequirementMathLit) {
                    requiredAPS = course.apsRequirementMathLit;
                } else if (hasTechMath && course.apsRequirementTechnicalMath) {
                    requiredAPS = course.apsRequirementTechnicalMath;
                } else {
                    // Course has math-type APS but user doesn't have a matching math subject -> disqualify
                    return false;
                }
            }

            if (aps < requiredAPS) return false;

            // If course specifies `level` then ensure user's general level meets or exceeds it
            if (course.level) {
                const courseLevel = (course.level || "")
                    .toString()
                    .toLowerCase();
                const reqRank = levelRank[courseLevel] || 0;
                const userRank = levelRank[userGeneralLevel] || 0;
                if (userRank < reqRank) return false;
            }

            // --- Language Requirements ---
            let meetsLanguageRequirements = true;
            if (
                course.languageRequirements &&
                course.languageRequirements.length > 0
            ) {
                for (const langReq of course.languageRequirements) {
                    const requiredLanguageName = idToName
                        .get(langReq.subjectId)
                        ?.toLowerCase();
                    if (!requiredLanguageName) continue;

                    const requiredHomePercent = Number(
                        langReq.homeLanguagePercentage || 0
                    );
                    const requiredAdditionalPercent = Number(
                        langReq.additionalLanguagePercentage || 0
                    );

                    // User must meet EITHER home language OR additional language requirement
                    let meetsThisLanguage = false;

                    // Check if user has this as home language
                    const homeLanguage = (
                        userSubjectsMap.get("home language") || ""
                    )
                        .toString()
                        .toLowerCase();
                    if (
                        homeLanguage.includes(requiredLanguageName) ||
                        requiredLanguageName.includes(homeLanguage)
                    ) {
                        const homePercent = Number(
                            userSubjectsMap.get("home language") || 0
                        );
                        if (homePercent >= requiredHomePercent) {
                            meetsThisLanguage = true;
                        }
                    }

                    // Check if user has this as additional language
                    const additionalLanguage = (
                        userSubjectsMap.get("additional language") || ""
                    )
                        .toString()
                        .toLowerCase();
                    if (
                        additionalLanguage.includes(requiredLanguageName) ||
                        requiredLanguageName.includes(additionalLanguage)
                    ) {
                        const additionalPercent = Number(
                            userSubjectsMap.get("additional language") || 0
                        );
                        if (additionalPercent >= requiredAdditionalPercent) {
                            meetsThisLanguage = true;
                        }
                    }

                    if (!meetsThisLanguage) {
                        meetsLanguageRequirements = false;
                        break;
                    }
                }
            }

            if (!meetsLanguageRequirements) return false;

            // --- Subject Requirements (AND logic) ---
            const mathReqs =
                course.subjectRequirements?.filter((req) =>
                    mathSubjects.includes(req.subjectId)
                ) || [];
            const otherReqs =
                course.subjectRequirements?.filter(
                    (req) => !mathSubjects.includes(req.subjectId)
                ) || [];

            // User must have at least ONE of the math requirements (if any)
            const meetsMath =
                mathReqs.length === 0 ||
                mathReqs.some((req) => {
                    const subject = idToName.get(req.subjectId)?.toLowerCase();
                    return (
                        (userSubjectsMap.get(subject) || 0) >= req.percentage
                    );
                });

            // User must have ALL of the other requirements
            const meetsOther =
                otherReqs.length === 0 ||
                otherReqs.every((req) => {
                    const subject = idToName.get(req.subjectId)?.toLowerCase();
                    return (
                        (userSubjectsMap.get(subject) || 0) >= req.percentage
                    );
                });

            // --- Subject Requirement Groups (OR logic) ---
            // User must meet at least ONE subject from EACH group
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

            return meetsMath && meetsOther && meetsGroups;
        })
        .map((course) => ({
            name: course.courseName,
            apsRequirement: course.apsRequirement,
            apsRequirementMathematics: course.apsRequirementMathematics,
            apsRequirementMathLit: course.apsRequirementMathLit,
            apsRequirementTechnicalMath: course.apsRequirementTechnicalMath,
            duration: course.duration,
            methodOfStudy: course.methodOfStudy,
            careerChoices: course.careerChoices,
            level: course.level,
            majoring: course.majoring,
            additionalRequirements: course.additionalRequirements,
            // Language Requirements
            languageRequirements: (course.languageRequirements || []).map(
                (req) => ({
                    subject: idToName.get(req.subjectId) || "Unknown Language",
                    homeLanguagePercentage: req.homeLanguagePercentage,
                    additionalLanguagePercentage:
                        req.additionalLanguagePercentage,
                })
            ),
            // Subject Requirements (AND)
            requirements: course.subjectRequirements?.map((req) => ({
                subject: idToName.get(req.subjectId) || "Unknown Subject",
                required: req.percentage,
            })),
            // Subject Requirement Groups (OR)
            requirementGroups: course.subjectRequirementGroups?.map((group) =>
                group.map((req) => ({
                    subject: idToName.get(req.subjectId) || "Unknown Subject",
                    required: req.percentage,
                }))
            ),
        }));
}
