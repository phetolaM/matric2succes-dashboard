// controllers/apsController.js
import { universities } from "./Index.js";

export function calculateAllUniversitiesAPS(subjects) {
    // Parse and normalize input data
    const parsedData = {
        // Language requirements
        homeLanguage: subjects.homeLanguage?.subject || "",
        homeLanguagePercent: Number(subjects.homeLanguage?.percent || 0),
        additionalLanguage: subjects.additionalLanguage?.subject || "",
        additionalLanguagePercent: Number(
            subjects.additionalLanguage?.percent || 0
        ),

        // Mathematics requirements
        mathSubject: subjects.mathSubject?.subject || "",
        mathPercent: Number(subjects.mathSubject?.percent || 0),
        mathLitSubject: subjects.mathLitSubject?.subject || "",
        mathLitPercent: Number(subjects.mathLitSubject?.percent || 0),
        technicalMathSubject: subjects.technicalMathSubject?.subject || "",
        technicalMathPercent: Number(
            subjects.technicalMathSubject?.percent || 0
        ),

        // Other requirements
        lifeOrientationPercent: Number(subjects.lifeOrientation?.percent || 0),
      
        otherSubjects: (subjects.otherSubjects || []).map((s) => ({
            subject: s.subject || "",
            percent: Number(s.percent || 0),
        })),
    };

    console.log(
        "📥 Universal parsed data:",
        JSON.stringify(parsedData, null, 2)
    );

    // Let each university handle its own requirements
    return Object.values(universities).map((uni) => {
        const apsResult = uni.calculateAPS(parsedData); // ✅ FIX: Define it here

        return { 
  university: uni.meta.code, 
//   aps: uni.calculateAPS(parsedData) 
  aps: apsResult.aps // Extract numeric APS value
};
    });
}
