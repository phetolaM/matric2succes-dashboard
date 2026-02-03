// apsLogic/universities/CPUT.js
export const meta = {
    code: "cput",
    displayName: "Cape Peninsula University of Technology",
    collections: ["cput"],
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

    // Other Subjects (excluding Life Orientation)
    (data.otherSubjects || []).forEach((subject) => {
        if (!/life orientation/i.test(subject.subject)) {
            totalAPS += percentToAps(subject.percent || 0);
        }
    });
    console.log(`UJ Aps Score:  ${totalAPS}`);
    return { aps: totalAPS };
}
export function getQualifiedCourses({ userSubjects, courses, idToName }) {
    // Helper: get N highest percentages (excluding Life Orientation and optionally others)
    function getTopNSubjects(n, exclude = []) {
        return userSubjects
            .filter(
                (s) =>
                    !/life orientation/i.test(s.subject) &&
                    !exclude.includes(s.subject.toLowerCase())
            )
            .sort((a, b) => Number(b.percent) - Number(a.percent))
            .slice(0, n);
    }

    return courses
        .map((course) => {
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

            // Prepare subject percents
            const homeLang = userSubjects.find(
                (s) => s.subject && /english/i.test(s.subject)
            );
            const addLang = userSubjects.find(
                (s) => s.subject && /afrikaans/i.test(s.subject)
            );
          const math = userSubjects.find(
    (s) => s.subject && /mathematics$/i.test(s.subject.trim())
);
            const acc = userSubjects.find((s) => /accounting/i.test(s.subject));
            const phys = userSubjects.find((s) =>
                /physical science/i.test(s.subject)
            );
            const eng = userSubjects.find((s) => /english/i.test(s.subject));

            console.log("User Math %:", math ? math.percent : undefined);
            console.log(
                "User Tech Math %:",
                userSubjects.find((s) =>
                    /technical mathematics/i.test(s.subject)
                )?.percent
            );
            console.log(
                "User Math Lit %:",
                userSubjects.find((s) =>
                    /mathematical literacy/i.test(s.subject)
                )?.percent
            );

            // --- APS Calculation by method ---
            let userAPS = 0;
            const method = Number(course.method) || 1;
            if (method === 1) {
                // 6 highest (including required), sum, divide by 10
                const allSubjects = userSubjects.filter(
                    (s) => !/life orientation/i.test(s.subject)
                );
                const top6 = allSubjects
                    .sort((a, b) => Number(b.percent) - Number(a.percent))
                    .slice(0, 6);
                const sum = top6.reduce((acc, s) => acc + Number(s.percent), 0);
                userAPS = Math.round(sum / 10);
            } else if (method === 2) {
                // Math, Physical Science, English, 4th highest (double Math & Science), sum, divide by 10
                const mathPercent = math ? Number(math.percent) : 0;
                const physPercent = phys ? Number(phys.percent) : 0;
                const engPercent = eng ? Number(eng.percent) : 0;
                const exclude = [
                    math?.subject?.toLowerCase(),
                    phys?.subject?.toLowerCase(),
                    eng?.subject?.toLowerCase(),
                ].filter(Boolean);
                const fourth = getTopNSubjects(1, exclude)[0];
                const sum =
                    2 * mathPercent +
                    2 * physPercent +
                    engPercent +
                    (fourth ? Number(fourth.percent) : 0);
                userAPS = Math.round(sum / 10);
            } else if (method === 3) {
                // Double Math & Accounting, add next 4 best, divide by 10
                const mathPercent = math ? Number(math.percent) : 0;
                const accPercent = acc ? Number(acc.percent) : 0;
                const exclude = [
                    math?.subject?.toLowerCase(),
                    acc?.subject?.toLowerCase(),
                ].filter(Boolean);
                const next4 = getTopNSubjects(4, exclude);
                const sum =
                    2 * mathPercent +
                    2 * accPercent +
                    next4.reduce((acc, s) => acc + Number(s.percent), 0);
                userAPS = Math.round(sum / 10);
            } else {
                userAPS = 0;
            }

            console.log("User APS (calculated for this course):", userAPS);

            // --- APS Requirement ---
            let minAPS = null;
            if (
                math &&
                course.apsRequirementMathematics &&
                !isNaN(Number(course.apsRequirementMathematics)) &&
                course.apsRequirementMathematics !== ""
            ) {
                minAPS = Number(course.apsRequirementMathematics);
            } else if (
                userSubjects.find((s) =>
                    /technical mathematics/i.test(s.subject)
                ) &&
                course.apsRequirementTechnicalMath &&
                !isNaN(Number(course.apsRequirementTechnicalMath)) &&
                course.apsRequirementTechnicalMath !== ""
            ) {
                minAPS = Number(course.apsRequirementTechnicalMath);
            } else if (
                userSubjects.find((s) =>
                    /mathematical literacy/i.test(s.subject)
                ) &&
                course.apsRequirementMathLit &&
                !isNaN(Number(course.apsRequirementMathLit)) &&
                course.apsRequirementMathLit !== ""
            ) {
                minAPS = Number(course.apsRequirementMathLit);
            }
            // If none found, minAPS stays null

            console.log("Required APS for this course:", minAPS);

            // --- Filter: APS must be met ---
            if (minAPS !== null && userAPS < minAPS) {
                console.log("Does NOT qualify: User APS <", minAPS);
                return null;
            }

            // --- Subject requirements ---
            const requirementMap = new Map(
                (course.subjectRequirements || []).map((req) => [
                    idToName.get(req.subjectId)?.toLowerCase(),
                    Number(req.percentage),
                ])
            );
            const userSubjectMap = new Map(
                userSubjects.map((s) => [s.subject.toLowerCase(), s.percent])
            );
            const meetsSubjects = Array.from(requirementMap.entries()).every(
                ([subject, required]) =>
                    (userSubjectMap.get(subject) || 0) >= required
            );

            console.log("Meets Subject Requirements:", meetsSubjects);

            if (!meetsSubjects) {
                console.log("Does NOT qualify: Subject requirements not met");
                return null;
            }

            // --- Subject requirement groups (OR logic) ---
            const requirementGroups = Array.isArray(
                course.subjectRequirementGroups
            )
                ? course.subjectRequirementGroups
                      .filter(Array.isArray)
                      .map((group) =>
                          group.map((req) => ({
                              name: idToName.get(req.subjectId)?.toLowerCase(),
                              required: Number(req.percentage),
                          }))
                      )
                : [];
            const meetsGroups = requirementGroups.every((group) =>
                group.some(
                    ({ name, required }) =>
                        (userSubjectMap.get(name) || 0) >= required
                )
            );

            console.log("Meets Subject Groups:", meetsGroups);

            if (!meetsGroups) {
                console.log(
                    "Does NOT qualify: Subject group requirements not met"
                );
                return null;
            }

            // --- Home/Additional Language requirements (optional) ---
            let meetsHomeLanguage = true;
            if (
                course.homeLanguageRequirement &&
                course.homeLanguageRequirement.percentage
            ) {
                const requiredPercent = Number(
                    course.homeLanguageRequirement.percentage
                );
                meetsHomeLanguage =
                    homeLang && Number(homeLang.percent) >= requiredPercent;
            }
            console.log("Meets Home Language:", meetsHomeLanguage);
            if (!meetsHomeLanguage) {
                console.log(
                    "Does NOT qualify: Home language requirement not met"
                );
                return null;
            }

            let meetsAdditionalLanguage = true;
            if (
                course.additionalLanguageRequirement &&
                course.additionalLanguageRequirement.percentage
            ) {
                const requiredPercent = Number(
                    course.additionalLanguageRequirement.percentage
                );
                meetsAdditionalLanguage =
                    addLang && Number(addLang.percent) >= requiredPercent;
            }
            console.log("Meets Additional Language:", meetsAdditionalLanguage);
            if (!meetsAdditionalLanguage) {
                console.log(
                    "Does NOT qualify: Additional language requirement not met"
                );
                return null;
            }

            // Collect all present APS requirements for math types
            const minAPSList = [];
            if (
                course.apsRequirementMathematics &&
                course.apsRequirementMathematics !== ""
            ) {
                minAPSList.push({
                    label: "Mathematics",
                    value: Number(course.apsRequirementMathematics),
                });
            }
            if (
                course.apsRequirementMathLit &&
                course.apsRequirementMathLit !== ""
            ) {
                minAPSList.push({
                    label: "Mathematical Literacy",
                    value: Number(course.apsRequirementMathLit),
                });
            }
            if (
                course.apsRequirementTechnicalMath &&
                course.apsRequirementTechnicalMath !== ""
            ) {
                minAPSList.push({
                    label: "Technical Mathematics",
                    value: Number(course.apsRequirementTechnicalMath),
                });
            }

            console.log(">>> Final Decision:", "QUALIFIES ✅");

            // --- Return qualified course ---
            return {
                // courseId: course._id,
                method,
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
                calculatedAPS: userAPS,
                minRequiredAPS: minAPS,
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
                additionalLanguageRequirement:
                    course.additionalLanguageRequirement
                        ? {
                              subject:
                                  course.additionalLanguageRequirement
                                      .subjectId === "all"
                                      ? "All Languages"
                                      : idToName.get(
                                            course.additionalLanguageRequirement
                                                .subjectId
                                        ) || "Unknown Subject",
                              percentage:
                                  course.additionalLanguageRequirement
                                      .percentage,
                          }
                        : null,
                requirements: {
                    subjects: Array.from(requirementMap.entries()).map(
                        ([name, required]) => ({
                            subject: name,
                            required,
                            actual: userSubjectMap.get(name) || 0,
                            met: (userSubjectMap.get(name) || 0) >= required,
                        })
                    ),
                    groups: Array.isArray(requirementGroups)
                        ? requirementGroups.map((group, i) => ({
                              groupId: i + 1,
                              requirements: Array.isArray(group)
                                  ? group.map(({ name, required }) => ({
                                        subject: name,
                                        required,
                                        actual: userSubjectMap.get(name) || 0,
                                        met:
                                            (userSubjectMap.get(name) || 0) >=
                                            required,
                                    }))
                                  : [],
                              met: Array.isArray(group)
                                  ? group.some(
                                        ({ name, required }) =>
                                            (userSubjectMap.get(name) || 0) >=
                                            required
                                    )
                                  : false,
                          }))
                        : [],
                },
            };
        })
        .filter(Boolean); // Only return qualified courses
}
