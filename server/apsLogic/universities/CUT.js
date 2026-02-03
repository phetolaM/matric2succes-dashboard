// apsLogic/universities/CUT.js
export const meta = {
    code: "cut",
    displayName: "Central University of Technology",
    collections: ["cut"],
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

    // Life Orientation handling (add 1 point if present, regardless of percentage)
    let hasLifeOrientation = false;

    // Check dedicated LO field
    if (typeof data.lifeOrientationPercent === "number") {
        hasLifeOrientation = true;
    }

    // Check otherSubjects for LO
    if (Array.isArray(data.otherSubjects)) {
        hasLifeOrientation =
            data.otherSubjects.some((subject) =>
                /life orientation/i.test(subject.subject)
            ) || hasLifeOrientation;
    }

    // Add 1 APS point if LO is present
    if (hasLifeOrientation) {
        totalAPS += 1;
    }
    console.log("CUT APS: ", totalAPS);
    return { aps: totalAPS };
}

export function getQualifiedCourses({
    aps,
    userSubjectsMap,
    courses,
    idToName,
    mathSubjects = meta.mathSubjects,
}) {
    // console.log("Received APS:", aps);
    // console.log("User subjects map:", [...userSubjectsMap.entries()]);
    // console.log("Total courses received:", courses.length);

    return courses
        .filter((course) => {
            // console.log(
            //     `\nChecking course: ${course.courseName} (${course.courseCode})`
            // );

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

            // console.log(`Required APS for course: ${requiredAPS}`);
            if (aps < requiredAPS) {
                // console.log("APS too low. Skipping.");
                return false;
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
                    const score = userSubjectsMap.get(subject) || 0;
                    const result = score >= req.percentage;
                    // console.log(
                    //     `Math requirement check - ${subject}: required ${
                    //         req.percentage
                    //     }, user ${score} -> ${result ? "✓ Passed" : "✗ Failed"}`
                    // );
                    return result;
                });

            const otherReqs =
                course.subjectRequirements?.filter(
                    (req) => !mathSubjects.includes(req.subjectId)
                ) || [];

            const meetsOther =
                otherReqs.length === 0 ||
                otherReqs.every((req) => {
                    const subject = idToName.get(req.subjectId)?.toLowerCase();
                    const score = userSubjectsMap.get(subject) || 0;
                    const result = score >= req.percentage;
                    // console.log(
                    //     `Other requirement check - ${subject}: required ${
                    //         req.percentage
                    //     }, user ${score} -> ${result ? "✓ Passed" : "✗ Failed"}`
                    // );
                    return result;
                });

            const meetsGroups =
                !course.subjectRequirementGroups?.length ||
                course.subjectRequirementGroups.every((group, i) => {
                    let matchedSubject = null;
                    const groupResult = group.some((req) => {
                        const subject = idToName
                            .get(req.subjectId)
                            ?.toLowerCase();
                        const score = userSubjectsMap.get(subject) || 0;
                        if (score >= req.percentage) {
                            matchedSubject = subject;
                            return true;
                        }
                        return false;
                    });
                    // console.log(
                    //     `Group ${i + 1} check: ${
                    //         groupResult
                    //             ? `✓ Passed (via ${matchedSubject})`
                    //             : "✗ Failed"
                    //     }`
                    // );
                    return groupResult;
                });

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

            const qualified =
                meetsMath &&
                meetsOther &&
                meetsGroups &&
                meetsHomeLanguage &&
                meetsAdditionalLanguage;
            // console.log(
            //     `Final Qualification Status: ${
            //         qualified ? "✓ Qualified" : "✗ Not Qualified"
            //     }`
            // );

            return qualified;
        })
        .map((course) => {
            console.log("✔ Qualified course:", course.courseName);
            return {
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
                requirementGroups: course.subjectRequirementGroups?.map(
                    (group) =>
                        group.map((req) => ({
                            subject:
                                idToName.get(req.subjectId) ||
                                "Unknown Subject",
                            required: req.percentage,
                        }))
                ),
                careerChoices: course.careerChoices,
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
            };
        });
}
