export const meta = {
    code: "ru",
    displayName: "Rhodes University",
    collections: ["ru"],
    mathSubjects: [
        "682320f89c61006b5937180c", // Mathematics
        "682346d7af0e046517c46da6", // Mathematical Literacy
        "68234b52af0e046517c46df4", // Technical Mathematics
    ],
};

export function calculateAPS(data) {
    // Convert percentage directly to points (percentage/10)
    const percentToPoints = (percent) => (percent || 0) / 10;

    // Core subjects (always included)
    const coreSubjects = [
        data.homeLanguagePercent,
        data.additionalLanguagePercent,
        Math.max(
            data.mathPercent || 0,
            data.technicalMathPercent || 0,
            data.mathLitPercent || 0
        ),
    ];

    // Other subjects (excluding LO, sorted descending)
    const otherSubjects = (data.otherSubjects || [])
        .filter((subject) => !/life orientation/i.test(subject.subject))
        .map((subject) => subject.percent)
        .sort((a, b) => b - a);

    // Select top 3 other subjects (to make total of 6 subjects)
    const selectedSubjects = [...coreSubjects, ...otherSubjects.slice(0, 3)];

    // Calculate total APS
    const totalAPS = selectedSubjects.reduce(
        (sum, percent) => sum + percentToPoints(percent),
        0
    );

    console.log(`Rhodes APS Score: ${totalAPS.toFixed(1)}`);
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
            // APS requirement check
            if (aps < course.apsRequirement) return false;

            // Subject requirements check
            const mathReqs =
                course.subjectRequirements?.filter((req) =>
                    mathSubjects.includes(req.subjectId)
                ) || [];

            const otherReqs =
                course.subjectRequirements?.filter(
                    (req) => !mathSubjects.includes(req.subjectId)
                ) || [];

            const meetsMath =
                mathReqs.length === 0 ||
                mathReqs.some((req) => {
                    const subject = idToName.get(req.subjectId)?.toLowerCase();
                    return (
                        (userSubjectsMap.get(subject) || 0) >= req.percentage
                    );
                });

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

            // --- Home Language Requirement ---
            let meetsHomeLanguage = true;
            if (
                course.homeLanguageRequirement &&
                course.homeLanguageRequirement.percentage
            ) {
                const required = course.homeLanguageRequirement;
                const requiredPercent = Number(required.percentage);
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
                        userSubjectsMap.get(subjectName) >= requiredPercent;
                }
            }

            // --- Additional Language Requirement ---
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
                        userSubjectsMap.get("additional language") >=
                            requiredPercent;
                } else if (required.subjectId) {
                    const subjectName = idToName
                        .get(required.subjectId)
                        ?.toLowerCase();
                    meetsAdditionalLanguage =
                        userSubjectsMap.get(subjectName) >= requiredPercent;
                }
            }

            return (
                meetsMath &&
                meetsOther &&
                meetsGroups &&
                meetsHomeLanguage &&
                meetsAdditionalLanguage
            );
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
        }));
}
