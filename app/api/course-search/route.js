import { getDbConnection } from "@/lib/db/connection";
import { DATABASES } from "@/lib/db/databases";
import { getSubjectModel } from "@/lib/models/subject";

export const dynamic = "force-dynamic";

const UNIVERSITY_DISPLAY_NAMES = {
    uj: "University of Johannesburg",
    up: "University of Pretoria",
    uwc: "University of the Western Cape",
    wsu: "Walter Sisulu University",
    uct: "University of Cape Town",
    ufh: "University of Fort Hare",
    ufs: "University of the Free State",
    ukzn: "University of KwaZulu-Natal",
    ul: "University of Limpopo",
    nwu: "North-West University",
    ru: "Rhodes University",
    smu: "Sefako Makgatho Health Sciences University",
    su: "Stellenbosch University",
    wits: "University of the Witwatersrand",
    cput: "Cape Peninsula University of Technology",
    cut: "Central University of Technology",
    dut: "Durban University of Technology",
    mut: "Mangosuthu University of Technology",
    tut: "Tshwane University of Technology",
    vut: "Vaal University of Technology",
    nmu: "Nelson Mandela University",
    unisa: "University of South Africa",
    univen: "University of Venda",
    unizulu: "University of Zululand",
    spu: "Sol Plaatje University",
    ump: "University of Mpumalanga",
};

const APS_VISIBILITY_COLLECTION = "visibility";

function escapeRegex(value) {
    return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normalizeKey(value) {
    return String(value || "")
        .trim()
        .toLowerCase()
        .replace(/\s+/g, " ");
}

function titleCase(value) {
    return String(value || "")
        .split(/\s+/)
        .filter(Boolean)
        .map((word) => {
            if (/^[A-Z0-9]+$/.test(word)) return word;
            return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
        })
        .join(" ");
}

function formatPercent(value) {
    if (value === null || value === undefined || value === "") return "";
    const numeric = Number(value);
    return Number.isFinite(numeric) ? `${numeric}%` : String(value).trim();
}

function formatApsValue(course) {
    const seen = new Set();
    const queue = [
        course?.apsRequirement,
        course?.apsRequirementExtended,
        course?.apsRequirementMathematics,
        course?.apsRequirementMathLit,
        course?.apsRequirementTechnicalMath,
        course?.apsRequirementExtendedMathematics,
        course?.apsRequirementExtendedMathLit,
        course?.apsRequirementExtendedTechnicalMath,
        course?.apsRequirementVariants,
    ];

    while (queue.length > 0) {
        const candidate = queue.shift();

        if (
            candidate === null ||
            candidate === undefined ||
            candidate === "" ||
            seen.has(candidate)
        ) {
            continue;
        }

        if (Array.isArray(candidate)) {
            seen.add(candidate);
            queue.unshift(...candidate);
            continue;
        }

        if (typeof candidate === "object") {
            seen.add(candidate);
            queue.unshift(
                candidate.aps,
                candidate.value,
                candidate.general,
                candidate.main,
                candidate.requirement,
                candidate.score,
                candidate.level,
            );
            continue;
        }

        const numeric = Number(candidate);
        if (Number.isFinite(numeric)) {
            return String(numeric);
        }

        const text = String(candidate).trim();
        if (text) {
            return text;
        }
    }

    return "-";
}

function collectAllApsValues(course) {
    const seen = new Set();
    const values = [];
    const queue = [
        course?.apsRequirement,
        course?.apsRequirementExtended,
        course?.apsRequirementMathematics,
        course?.apsRequirementMathLit,
        course?.apsRequirementTechnical,
        course?.apsRequirementExtendedMathematics,
        course?.apsRequirementExtendedMathLit,
        course?.apsRequirementExtendedTechnicalMath,
        course?.apsRequirementVariants,
        course?.aps,
        course?.apsValue,
        course?.requirement,
    ];

    while (queue.length > 0) {
        const candidate = queue.shift();

        if (
            candidate === null ||
            candidate === undefined ||
            candidate === "" ||
            seen.has(candidate)
        ) {
            continue;
        }

        if (Array.isArray(candidate)) {
            seen.add(candidate);
            queue.unshift(...candidate);
            continue;
        }

        if (typeof candidate === "object") {
            seen.add(candidate);
            queue.unshift(
                candidate.aps,
                candidate.value,
                candidate.general,
                candidate.main,
                candidate.requirement,
                candidate.score,
                candidate.level,
                candidate.mathematics,
                candidate.maths,
                candidate.math,
                candidate.mathLit,
            );
            continue;
        }

        const numeric = Number(candidate);
        const text = Number.isFinite(numeric)
            ? String(numeric)
            : String(candidate).trim();
        if (text) {
            const normalized = text;
            if (!values.includes(normalized)) values.push(normalized);
        }
    }

    return values;
}

function getUniversityDisplayName(collectionName) {
    return (
        UNIVERSITY_DISPLAY_NAMES[collectionName] ||
        titleCase(collectionName || "")
    );
}

async function getVisibleUniversityCodes() {
    const visibilityConn = await getDbConnection(DATABASES.APS_VISIBILITY);
    const visibilityCol = visibilityConn.collection(APS_VISIBILITY_COLLECTION);
    const docs = await visibilityCol.find({}).toArray();

    if (!Array.isArray(docs) || docs.length === 0) {
        return null;
    }

    return new Set(
        docs
            .filter((doc) => doc?.enabled !== false)
            .map((doc) =>
                String(doc.code || "")
                    .trim()
                    .toLowerCase(),
            )
            .filter(Boolean),
    );
}

function resolveSubjectName(item, subjectLookup) {
    const candidates = [
        item?.subjectName,
        item?.name,
        item?.subject,
        item?.label,
        item?.title,
        item?.subjectId,
        item?.id,
    ];

    for (const candidate of candidates) {
        if (!candidate) continue;

        const raw = String(candidate).trim();
        if (!raw) continue;

        const lookupById = subjectLookup.byId.get(raw);
        if (lookupById) return lookupById;

        const normalized = normalizeKey(raw);
        const lookupByName = subjectLookup.byName.get(normalized);
        if (lookupByName) return lookupByName;

        return raw;
    }

    return "";
}

function addUniqueEntry(entries, value) {
    const normalizedValue = String(value || "").trim();

    if (!normalizedValue) return;

    if (!entries.includes(normalizedValue)) {
        entries.push(normalizedValue);
    }
}

function combineRequirementValues(item) {
    const parts = [];
    const homeLanguage =
        item?.homeLanguagePercentage ?? item?.homeLanguagePercent;
    const additionalLanguage =
        item?.additionalLanguagePercentage ?? item?.additionalLanguagePercent;

    if (
        homeLanguage !== undefined &&
        homeLanguage !== null &&
        homeLanguage !== ""
    ) {
        parts.push(`home language ${formatPercent(homeLanguage)}`.trim());
    }

    if (
        additionalLanguage !== undefined &&
        additionalLanguage !== null &&
        additionalLanguage !== ""
    ) {
        parts.push(
            `additional language ${formatPercent(additionalLanguage)}`.trim(),
        );
    }

    if (parts.length > 0) {
        return parts.join(" / ");
    }

    return formatPercent(item?.percentage);
}

function formatLanguageRequirement(item, subjectName) {
    const subjectLabel = subjectName || "Language requirement";
    const values = combineRequirementValues(item);

    if (!values) return subjectLabel;

    return `${subjectLabel} ${values}`.trim();
}

function formatSubjectRequirement(item, subjectName) {
    const subjectLabel = subjectName || "Subject";
    const percentage = formatPercent(item?.percentage);

    if (!percentage) return subjectLabel;

    return `${subjectLabel} ${percentage}`.trim();
}

function formatGroupRequirement(group, subjectLookup) {
    const items = Array.isArray(group) ? group : [];

    return items
        .map((item) => {
            const subjectName = resolveSubjectName(item, subjectLookup);
            const percentage =
                item?.percentage ??
                item?.homeLanguagePercentage ??
                item?.additionalLanguagePercentage;
            const percentageText = formatPercent(percentage);

            if (!subjectName && !percentageText) return "";
            if (!subjectName) return percentageText;
            if (!percentageText) return subjectName;

            return `${subjectName} ${percentageText}`.trim();
        })
        .filter(Boolean)
        .join(" OR ");
}

function normalizeCourse(course, collectionName, subjectLookup) {
    const englishRequirementText = [];
    const languageRequirementText = [];
    const subjectRequirementText = [];
    const subjectRequirementGroupsText = [];

    const languageRequirements = Array.isArray(course?.languageRequirements)
        ? course.languageRequirements
        : [];

    languageRequirements.forEach((item) => {
        const subjectName = resolveSubjectName(item, subjectLookup);
        const cellValue = combineRequirementValues(item);
        const formattedText = formatLanguageRequirement(item, subjectName);

        if (normalizeKey(subjectName) === "english") {
            addUniqueEntry(englishRequirementText, formattedText || cellValue);
        } else if (formattedText) {
            languageRequirementText.push(formattedText);
        }
    });

    const standaloneLanguageRequirements = [
        course?.homeLanguageRequirement
            ? {
                  ...course.homeLanguageRequirement,
                  requirementType: "home",
              }
            : null,
        course?.additionalLanguageRequirement
            ? {
                  ...course.additionalLanguageRequirement,
                  requirementType: "additional",
              }
            : null,
    ].filter(Boolean);

    standaloneLanguageRequirements.forEach((item) => {
        const subjectName =
            resolveSubjectName(item, subjectLookup) || "English";
        const percentageText = formatPercent(item?.percentage);
        const formattedText =
            `${subjectName} ${item.requirementType || "language"} language ${percentageText}`.trim();

        if (normalizeKey(subjectName) === "english") {
            addUniqueEntry(englishRequirementText, formattedText);
        } else if (formattedText) {
            languageRequirementText.push(formattedText);
        }
    });

    const subjectRequirements = Array.isArray(course?.subjectRequirements)
        ? course.subjectRequirements
        : [];

    subjectRequirements.forEach((item) => {
        const subjectName = resolveSubjectName(item, subjectLookup);
        const formattedText = formatSubjectRequirement(item, subjectName);

        if (normalizeKey(subjectName) === "english") {
            addUniqueEntry(englishRequirementText, formattedText);
        } else if (formattedText) {
            subjectRequirementText.push(formattedText);
        }
    });

    const subjectRequirementGroups = Array.isArray(
        course?.subjectRequirementGroups,
    )
        ? course.subjectRequirementGroups
        : [];

    subjectRequirementGroups.forEach((group) => {
        const formattedGroup = formatGroupRequirement(group, subjectLookup);
        if (formattedGroup) {
            subjectRequirementGroupsText.push(formattedGroup);
        }
    });

    const courseName =
        course?.courseName ||
        course?.majoring ||
        course?.title ||
        "Unknown course";

    const apsGeneral = formatApsValue(course);
    const apsVariants = collectAllApsValues(course).filter(
        (v) => v && v !== apsGeneral,
    );

    return {
        courseName,
        courseCode: course?.courseCode || "-",
        aps: apsGeneral,
        apsGeneral,
        apsVariants,
        methodOfStudy: course?.methodOfStudy || "-",
        collectionName,
        universityName: getUniversityDisplayName(collectionName),
        englishRequirementText:
            englishRequirementText.length > 0
                ? englishRequirementText.join("; ")
                : "-",
        languageRequirementText:
            languageRequirementText.length > 0
                ? languageRequirementText.join("; ")
                : "-",
        subjectRequirementText:
            subjectRequirementText.length > 0
                ? subjectRequirementText.join("; ")
                : "-",
        subjectRequirementGroups:
            subjectRequirementGroupsText.length > 0
                ? subjectRequirementGroupsText
                : [],
        subjectRequirementGroupsText:
            subjectRequirementGroupsText.length > 0
                ? subjectRequirementGroupsText.join("; ")
                : "-",
    };
}

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const query = String(searchParams.get("q") || "").trim();

        if (!query) {
            return Response.json({ results: [] });
        }

        const conn = await getDbConnection(DATABASES.UNIVERSITY_COURSES);
        const subjectsConn = await getDbConnection(DATABASES.SUBJECTS);
        const SubjectModel = getSubjectModel(subjectsConn);
        const subjectDocs = await SubjectModel.find({}).lean();
        const visibleUniversityCodes = await getVisibleUniversityCodes();

        const subjectLookup = {
            byId: new Map(),
            byName: new Map(),
        };

        subjectDocs.forEach((doc) => {
            const id = doc?._id?.toString?.();
            const name = String(doc?.name || "").trim();

            if (id) {
                subjectLookup.byId.set(id, name);
            }

            if (name) {
                subjectLookup.byName.set(normalizeKey(name), name);
            }
        });

        const collections = await conn.db.listCollections().toArray();
        const collectionNames = collections
            .map((collection) => collection?.name)
            .filter(Boolean)
            .filter((name) => !name.startsWith("system."))
            .filter((name) => {
                if (!visibleUniversityCodes) return true;
                return visibleUniversityCodes.has(String(name).toLowerCase());
            });

        const escapedQuery = escapeRegex(query);
        const searchRegex = new RegExp(escapedQuery, "i");

        const resultsByCourse = [];

        for (const collectionName of collectionNames) {
            const collection = conn.collection(collectionName);
            const matches = await collection
                .find({
                    $or: [
                        { courseName: searchRegex },
                        { majoring: searchRegex },
                        { courseCode: searchRegex },
                    ],
                })
                .sort({ courseName: 1 })
                .toArray();

            matches.forEach((course) => {
                resultsByCourse.push(
                    normalizeCourse(course, collectionName, subjectLookup),
                );
            });
        }

        return Response.json({
            results: resultsByCourse,
        });
    } catch (err) {
        console.error("Failed to search courses:", err.message);
        return Response.json(
            { message: "Failed to search courses" },
            { status: 500 },
        );
    }
}
