"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { FaUniversity } from "react-icons/fa";
import {
    FiAlertCircle,
    FiArrowLeft,
    FiBook,
    FiEdit,
    FiHome,
    FiPlus,
    FiRefreshCw,
    FiSearch,
} from "react-icons/fi";
import styles from "./page.module.css";

// Universities that have dedicated forms
const UNIVERSITIES_WITH_FORMS = [
    "uj",
    "wsu",
    "unisa",
    "nmu",
    "mut",
    "smu",
    "tut",
    "ukzn",
];

const getUniversityDisplayName = (collectionName) => {
    const map = {
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

    return map[collectionName] || collectionName?.toUpperCase() || "";
};

export default function CourseCollectionDetailPage() {
    const router = useRouter();
    const params = useParams();
    const collection = params?.collection?.toString() || "";

    const [courses, setCourses] = useState([]);
    const [filteredCourses, setFilteredCourses] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [error, setError] = useState("");
    const [showNoFormAlert, setShowNoFormAlert] = useState(false);

    const hasForm = UNIVERSITIES_WITH_FORMS.includes(collection.toLowerCase());

    const title = useMemo(
        () => getUniversityDisplayName(collection),
        [collection],
    );

    useEffect(() => {
        if (collection) {
            fetchCourses();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [collection]);

    useEffect(() => {
        const term = searchTerm.trim().toLowerCase();
        const filtered = courses.filter((course) => {
            const name = course.courseName?.toLowerCase() || "";
            const code = course.courseCode?.toLowerCase() || "";
            const major = course.majoring?.toLowerCase() || "";
            return (
                name.includes(term) ||
                code.includes(term) ||
                major.includes(term)
            );
        });
        setFilteredCourses(filtered);
    }, [searchTerm, courses]);

    const fetchCourses = async () => {
        try {
            setIsRefreshing(true);
            setError("");
            const res = await fetch(`/api/course-collections/${collection}`, {
                cache: "no-store",
            });

            if (!res.ok) throw new Error("Failed to fetch courses");

            const data = await res.json();
            setCourses(data || []);
            setFilteredCourses(data || []);
        } catch (err) {
            console.error("Failed to fetch courses:", err);
            setError(err?.message || "Unable to load courses right now.");
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    };

    const handleRetry = () => {
        setSearchTerm("");
        fetchCourses();
    };

    const handleAddCourse = () => {
        if (!hasForm) {
            setShowNoFormAlert(true);
            return;
        }
        router.push(`/admin/university-forms/${collection}/add`);
    };

    const handleEditCourse = (courseId) => {
        if (!hasForm) {
            setShowNoFormAlert(true);
            return;
        }
        router.push(
            `/admin/university-forms/${collection}/edit?id=${courseId}`,
        );
    };

    const renderGrid = () => {
        if (isLoading) {
            return (
                <div className={styles.grid}>
                    {Array.from({ length: 8 }).map((_, idx) => (
                        <div key={idx} className={styles.cardSkeleton} />
                    ))}
                </div>
            );
        }

        if (filteredCourses.length === 0) {
            return (
                <div className={styles.emptyState}>
                    <p>No courses match your search.</p>
                </div>
            );
        }

        return (
            <div className={styles.grid}>
                {filteredCourses.map((course) => (
                    <article
                        key={
                            course._id || course.courseCode || course.courseName
                        }
                        className={styles.card}
                        onClick={() => handleEditCourse(course._id)}
                        style={{ cursor: "pointer" }}
                    >
                        <div className={styles.cardHeader}>
                            <div className={styles.iconWrap}>
                                <FiBook />
                            </div>
                            <div className={styles.cardHeaderContent}>
                                <p className={styles.cardLabel}>{collection}</p>
                                <h3 className={styles.cardTitle}>
                                    {course.courseName || "Untitled course"}
                                </h3>
                            </div>
                            <button
                                className={styles.editButton}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleEditCourse(course._id);
                                }}
                                type="button"
                                aria-label="Edit course"
                            >
                                <FiEdit />
                            </button>
                        </div>

                        <div className={styles.metaRow}>
                            {course.courseCode && (
                                <span className={styles.chip}>
                                    Code: {course.courseCode}
                                </span>
                            )}
                            {course.duration && (
                                <span className={styles.chip}>
                                    Duration: {course.duration}
                                </span>
                            )}
                            {course.methodOfStudy && (
                                <span className={styles.chip}>
                                    Mode: {course.methodOfStudy}
                                </span>
                            )}
                        </div>

                        {(course.apsRequirement ||
                            course.apsRequirementMathematics ||
                            course.apsRequirementMathLit ||
                            course.apsRequirementTechnicalMath) && (
                            <div className={styles.apsRow}>
                                <span className={styles.apsBadge}>APS</span>
                                {course.apsRequirement && (
                                    <span>
                                        Overall: {course.apsRequirement}
                                    </span>
                                )}
                                {course.apsRequirementMathematics && (
                                    <span>
                                        Math: {course.apsRequirementMathematics}
                                    </span>
                                )}
                                {course.apsRequirementMathLit && (
                                    <span>
                                        Math Lit: {course.apsRequirementMathLit}
                                    </span>
                                )}
                                {course.apsRequirementTechnicalMath && (
                                    <span>
                                        Technical Math:{" "}
                                        {course.apsRequirementTechnicalMath}
                                    </span>
                                )}
                            </div>
                        )}

                        {(collection.toLowerCase() === "nmu"
                            ? course.faculty
                            : course.majoring) && (
                            <p className={styles.subtext}>
                                {collection.toLowerCase() === "nmu"
                                    ? "Faculty"
                                    : "Major"}
                                :{" "}
                                {collection.toLowerCase() === "nmu"
                                    ? course.faculty
                                    : course.majoring}
                            </p>
                        )}

                        {Array.isArray(course.campuses) &&
                            course.campuses.length > 0 && (
                                <div className={styles.campusRow}>
                                    <FiHome />
                                    <span>{course.campuses.join(", ")}</span>
                                </div>
                            )}
                    </article>
                ))}
            </div>
        );
    };

    return (
        <div className={styles.container}>
            <div className={styles.inner}>
                <header className={styles.header}>
                    <button
                        className={styles.backButton}
                        onClick={() => router.push("/admin/course-collection")}
                        type="button"
                    >
                        <FiArrowLeft />
                        <span>Back to collections</span>
                    </button>

                    <div className={styles.titleBlock}>
                        <div className={styles.titleIcon}>
                            <FaUniversity />
                        </div>
                        <div>
                            <p className={styles.titleLabel}>{collection}</p>
                            <h1 className={styles.title}>{title}</h1>
                        </div>
                    </div>

                    <button
                        className={styles.refreshButton}
                        onClick={fetchCourses}
                        disabled={isRefreshing}
                        type="button"
                    >
                        <FiRefreshCw
                            className={isRefreshing ? styles.spin : undefined}
                        />
                        <span>{isRefreshing ? "Refreshing" : "Refresh"}</span>
                    </button>
                    <button
                        className={styles.addButton}
                        onClick={handleAddCourse}
                        type="button"
                    >
                        <FiPlus />
                        <span>Add Course</span>
                    </button>
                </header>

                <div className={styles.statsBar}>
                    <div className={styles.statItem}>
                        <span className={styles.statLabel}>Total Courses</span>
                        <span className={styles.statValue}>
                            {courses.length}
                        </span>
                    </div>
                    {searchTerm && (
                        <div className={styles.statItem}>
                            <span className={styles.statLabel}>
                                Showing Results
                            </span>
                            <span className={styles.statValue}>
                                {filteredCourses.length}
                            </span>
                        </div>
                    )}
                </div>

                {showNoFormAlert && (
                    <div className={styles.alertCard}>
                        <div className={styles.alertIconWrap}>
                            <FiAlertCircle />
                        </div>
                        <div className={styles.alertContent}>
                            <h3>Course Form Not Found</h3>
                            <p>
                                No course form is available for {title}. Please
                                contact support to add form support for this
                                university.
                            </p>
                        </div>
                        <button
                            className={styles.dismissButton}
                            onClick={() => setShowNoFormAlert(false)}
                            type="button"
                        >
                            Dismiss
                        </button>
                    </div>
                )}

                {error && (
                    <div className={styles.errorCard}>
                        <div className={styles.errorIconWrap}>
                            <FiAlertCircle />
                        </div>
                        <div className={styles.errorContent}>
                            <h3>Something went wrong</h3>
                            <p>{error}</p>
                        </div>
                        <button
                            className={styles.retryButton}
                            onClick={handleRetry}
                            type="button"
                        >
                            Try Again
                        </button>
                    </div>
                )}

                <div className={styles.searchBar}>
                    <FiSearch className={styles.searchIcon} />
                    <input
                        type="text"
                        placeholder="Search courses (name, code, major)"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                {renderGrid()}
            </div>
        </div>
    );
}
