"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
    FiArrowLeft,
    FiSearch,
    FiLoader,
    FiAlertCircle,
    FiBookOpen,
    FiEyeOff,
    FiEye,
} from "react-icons/fi";
import styles from "./page.module.css";

function formatCellValue(value) {
    if (value === null || value === undefined || value === "") return "-";
    return String(value);
}

function cleanGroupText(value) {
    return String(value || "")
        .replace(/^\s*Group\s*\d+\s*:\s*/i, "")
        .replace(/\s+OR\s*$/i, "")
        .trim();
}

// function splitGroupBlob(value) {
//     const rawText = String(value || "").trim();
//     if (!rawText || rawText === "-") {
//         return [];
//     }

//     const splitOnGroupLabel = rawText.split(/\s*;\s*(?=Group\s*\d+\s*:)/i);
//     const chunks =
//         splitOnGroupLabel.length > 1
//             ? splitOnGroupLabel
//             : rawText.split(/\s*;\s*/);

//     return chunks.map(cleanGroupText).filter(Boolean);
// }
function splitGroupBlob(value) {
    const rawText = String(value || "").trim();
    if (!rawText || rawText === "-") return [];

    // Only split if the string actually contains "Group N:" markers
    if (/Group\s*\d+\s*:/i.test(rawText)) {
        return rawText
            .split(/\s*;\s*(?=Group\s*\d+\s*:)/i)
            .map(cleanGroupText)
            .filter(Boolean);
    }

    // Single group — return as-is, no splitting
    return [rawText.trim()].filter(Boolean);
}

function parseSubjectRequirementGroups(row) {
    const arrayGroups = Array.isArray(row?.subjectRequirementGroups)
        ? row.subjectRequirementGroups
        : [];

    if (arrayGroups.length > 0) {
        return arrayGroups.flatMap(splitGroupBlob);
    }

    const rawText = String(row?.subjectRequirementGroupsText || "").trim();
    return splitGroupBlob(rawText);
}

export default function CourseFinderPage() {
    const router = useRouter();
    const [query, setQuery] = useState("");
    const [submittedQuery, setSubmittedQuery] = useState("");
    const [results, setResults] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [showTopSection, setShowTopSection] = useState(true);

    const hasLanguageRequirement = results.some((row) => {
        const value = String(row?.languageRequirementText || "").trim();
        return value && value !== "-";
    });
    const hasGroupRequirement = results.some(
        (row) => parseSubjectRequirementGroups(row).length > 0,
    );
    const visibleColumnCount =
        5 +
        (hasLanguageRequirement ? 1 : 0) +
        (hasGroupRequirement ? 1 : 0);

    const handleSearch = async (event) => {
        event.preventDefault();

        const term = query.trim();
        if (!term) {
            setResults([]);
            setSubmittedQuery("");
            setError("Enter a course name to search.");
            return;
        }

        setIsLoading(true);
        setError("");

        try {
            const response = await fetch(
                `/api/course-search?q=${encodeURIComponent(term)}`,
                {
                    cache: "no-store",
                },
            );

            if (!response.ok) {
                throw new Error("Failed to fetch course results");
            }

            const data = await response.json();
            setResults(data.results || []);
            setSubmittedQuery(term);
            if (!data.results?.length) {
                setError("No courses matched that name.");
            }
        } catch (err) {
            console.error("Course search failed:", err);
            setResults([]);
            setSubmittedQuery(term);
            setError("Unable to search courses right now. Try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.backdrop} />

            <main
                className={`${styles.shell} ${
                    showTopSection ? "" : styles.shellCollapsed
                }`}
            >
               <header className={showTopSection ? styles.header : styles.headerCollapsed}>
                    <div className={styles.headerTopRow}>
                        <button
                            className={styles.backButton}
                            type="button"
                            onClick={() => router.push("/dashboard")}
                        >
                            <FiArrowLeft />
                            <span>Back to Dashboard</span>
                        </button>

                        <div className={styles.logoContainer}>
                            <Image
                                src="/logo.png"
                                alt="Logo"
                                width={100}
                                height={58}
                                priority
                            />
                        </div>

                        <button
                            className={styles.toggleButton}
                            type="button"
                            onClick={() => setShowTopSection((prev) => !prev)}
                        >
                            {showTopSection ? <FiEyeOff /> : <FiEye />}
                            <span>
                                {showTopSection ? "Hide Search" : "Show Search"}
                            </span>
                        </button>
                    </div>

                    {showTopSection && (
                        <div className={styles.hero}>
                            <div className={styles.heroIcon}>
                                <FiBookOpen />
                            </div>
                            <div>
                                <p className={styles.kicker}>Course Finder</p>
                                <h1 className={styles.title}>
                                    Search courses by university requirements
                                </h1>
                                <p className={styles.subtitle}>
                                    Find a course once, then compare the
                                    matching universities, English requirement,
                                    subject requirements, and grouped
                                    requirements in one table.
                                </p>
                            </div>
                        </div>
                    )}
                </header>

                {showTopSection && (
                    <section className={styles.searchCard}>
                        <form
                            className={styles.searchForm}
                            onSubmit={handleSearch}
                        >
                            <div className={styles.searchInputWrap}>
                                <FiSearch className={styles.searchIcon} />
                                <input
                                    className={styles.searchInput}
                                    type="text"
                                    placeholder="Enter a course name, for example Bachelor of Education"
                                    value={query}
                                    onChange={(event) =>
                                        setQuery(event.target.value)
                                    }
                                />
                            </div>

                            <button
                                className={styles.searchButton}
                                type="submit"
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <>
                                        <FiLoader className={styles.spin} />
                                        Searching...
                                    </>
                                ) : (
                                    <>
                                        <FiSearch />
                                        Search
                                    </>
                                )}
                            </button>
                        </form>

                        <div className={styles.searchMeta}>
                            <span>
                                {submittedQuery
                                    ? `Results for “${submittedQuery}”`
                                    : "Search to compare university requirements"}
                            </span>
                            <span>{results.length} matches</span>
                        </div>
                    </section>
                )}

                {error && (
                    <section className={styles.messageCard}>
                        <FiAlertCircle />
                        <p>{error}</p>
                    </section>
                )}

                <section
                    className={`${styles.tableCard} ${
                        showTopSection ? "" : styles.tableCardCollapsed
                    }`}
                >
                    <div
                        className={`${styles.tableScroll} ${
                            showTopSection ? "" : styles.tableScrollCollapsed
                        }`}
                    >
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th>Course</th>
                                    <th>University</th>
                                    <th>APS</th>
                                    <th>English</th>
                                    {hasLanguageRequirement && (
                                        <th>Language Requirement</th>
                                    )}
                                    <th>Subject Requirements</th>
                                    {hasGroupRequirement && (
                                        <th>Subject Requirement Groups</th>
                                    )}
                                </tr>
                            </thead>
                            <tbody>
                                {results.length === 0 ? (
                                    <tr>
                                        <td
                                            className={styles.emptyCell}
                                            colSpan={visibleColumnCount}
                                        >
                                            {isLoading
                                                ? "Loading courses..."
                                                : "Search for a course to see university-specific requirements."}
                                        </td>
                                    </tr>
                                ) : (
                                    results.map((row, index) => {
                                        const groups =
                                            parseSubjectRequirementGroups(row);

                                        return (
                                            <tr
                                                key={`${row.collectionName}-${row.courseName}-${index}`}
                                            >
                                                <td
                                                    className={
                                                        styles.courseCell
                                                    }
                                                >
                                                    {row.courseName}
                                                </td>
                                                <td>{row.universityName}</td>
                                                <td
                                                    title={
                                                        row.apsVariants &&
                                                        row.apsVariants.length
                                                            ? row.apsVariants.join(
                                                                  ", ",
                                                              )
                                                            : undefined
                                                    }
                                                >
                                                    {formatCellValue(row.aps)}
                                                </td>
                                                <td>
                                                    {formatCellValue(
                                                        row.englishRequirementText,
                                                    )}
                                                </td>
                                                {hasLanguageRequirement && (
                                                    <td>
                                                        {formatCellValue(
                                                            row.languageRequirementText,
                                                        )}
                                                    </td>
                                                )}
                                                <td>
                                                    {formatCellValue(
                                                        row.subjectRequirementText,
                                                    )}
                                                </td>
                                                {hasGroupRequirement && (
                                                    <td>
                                                        {groups.length > 0 ? (
                                                            <div
                                                                className={
                                                                    styles.groupStack
                                                                }
                                                            >
                                                                {groups.map(
                                                                    (
                                                                        groupText,
                                                                        groupIndex,
                                                                    ) => (
                                                                        <div
                                                                            key={`${row.collectionName}-${row.courseName}-group-${groupIndex}`}
                                                                            className={
                                                                                groupIndex %
                                                                                    2 ===
                                                                                0
                                                                                    ? styles.groupItemDark
                                                                                    : styles.groupItemLight
                                                                            }
                                                                        >
                                                                            {
                                                                                groupText
                                                                            }
                                                                        </div>
                                                                    ),
                                                                )}
                                                            </div>
                                                        ) : (
                                                            "-"
                                                        )}
                                                    </td>
                                                )}
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </section>
            </main>
        </div>
    );
}




