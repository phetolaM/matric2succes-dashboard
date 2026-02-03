"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./subjects.module.css";
import {
    FiArrowLeft,
    FiSearch,
    FiPlus,
    FiTrash2,
    FiBook,
    FiGlobe,
} from "react-icons/fi";

export default function SubjectsPage() {
    const router = useRouter();
    const [subjects, setSubjects] = useState([]);
    const [filteredSubjects, setFilteredSubjects] = useState([]);
    const [name, setName] = useState("");
    const [isLanguage, setIsLanguage] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [successMessage, setSuccessMessage] = useState("");
    const [showForm, setShowForm] = useState(false);

    useEffect(() => {
        fetchSubjects();
    }, []);

    const fetchSubjects = async () => {
        setIsLoading(true);
        try {
            const res = await fetch("/api/subjects");
            if (!res.ok) throw new Error("Failed to fetch subjects");
            const data = await res.json();
            setSubjects(data);
            setFilteredSubjects(data);
            setError("");
        } catch (err) {
            setError("Failed to fetch subjects");
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const addSubject = async (e) => {
        e.preventDefault();
        if (!name.trim() || isLanguage === null) {
            setError("Both name and subject type are required");
            return;
        }

        setIsLoading(true);
        try {
            const res = await fetch("/api/subjects", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name,
                    isLanguage,
                }),
            });

            if (!res.ok) {
                const data = await res.json();
                setError(data.error || "Failed to add subject");
                return;
            }

            const newSubject = await res.json();
            const updated = [...subjects, newSubject];
            setSubjects(updated);
            setFilteredSubjects(updated);
            setName("");
            setIsLanguage(null);
            setError("");
            setShowForm(false);
            setSuccessMessage("Subject added successfully!");
            setTimeout(() => setSuccessMessage(""), 3000);
        } catch (err) {
            setError("Failed to add subject");
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const deleteSubject = async (id) => {
        if (!window.confirm("Are you sure you want to delete this subject?"))
            return;

        try {
            const res = await fetch(`/api/subjects/${id}`, {
                method: "DELETE",
            });

            if (!res.ok) throw new Error("Failed to delete subject");

            const updatedSubjects = subjects.filter((subj) => subj._id !== id);
            setSubjects(updatedSubjects);
            setFilteredSubjects(updatedSubjects);
            setSuccessMessage("Subject deleted successfully!");
            setTimeout(() => setSuccessMessage(""), 3000);
        } catch (err) {
            setError("Failed to delete subject");
            console.error(err);
        }
    };

    const handleSearch = (e) => {
        const term = e.target.value.toLowerCase();
        setSearchTerm(term);
        const filtered = subjects.filter((subj) =>
            subj.name.toLowerCase().includes(term),
        );
        setFilteredSubjects(filtered);
    };

    const languageSubjects = filteredSubjects.filter((s) => s.isLanguage);
    const otherSubjects = filteredSubjects.filter((s) => !s.isLanguage);

    return (
        <div className={styles.container}>
            {/* Header */}
            <header className={styles.header}>
                <div className={styles.headerContent}>
                    <button
                        className={styles.backButton}
                        onClick={() => router.back()}
                        aria-label="Go back"
                    >
                        <FiArrowLeft />
                        <span>Back</span>
                    </button>
                    <div className={styles.headerTitle}>
                        <FiBook className={styles.headerIcon} />
                        <div>
                            <h1>Manage Subjects</h1>
                            <p>Add, search, and manage course subjects</p>
                        </div>
                    </div>
                </div>
            </header>

            <main className={styles.main}>
                {/* Alerts */}
                {error && (
                    <div className={`${styles.alert} ${styles.alertError}`}>
                        {error}
                    </div>
                )}
                {successMessage && (
                    <div className={`${styles.alert} ${styles.alertSuccess}`}>
                        {successMessage}
                    </div>
                )}

                {/* Action Bar */}
                <div className={styles.actionBar}>
                    <div className={styles.statsCards}>
                        <div className={styles.statCard}>
                            <span className={styles.statLabel}>
                                Total Subjects
                            </span>
                            <span className={styles.statValue}>
                                {subjects.length}
                            </span>
                        </div>
                        <div className={styles.statCard}>
                            <span className={styles.statLabel}>Languages</span>
                            <span className={styles.statValue}>
                                {subjects.filter((s) => s.isLanguage).length}
                            </span>
                        </div>
                        <div className={styles.statCard}>
                            <span className={styles.statLabel}>
                                Other Subjects
                            </span>
                            <span className={styles.statValue}>
                                {subjects.filter((s) => !s.isLanguage).length}
                            </span>
                        </div>
                    </div>
                    <button
                        className={`${styles.addButton} ${showForm ? styles.addButtonActive : ""}`}
                        onClick={() => {
                            setShowForm(!showForm);
                            setError("");
                        }}
                    >
                        <FiPlus />
                        <span>{showForm ? "Cancel" : "Add Subject"}</span>
                    </button>
                </div>

                {/* Add Subject Form */}
                {showForm && (
                    <div className={styles.formCard}>
                        <form onSubmit={addSubject} className={styles.form}>
                            <h2 className={styles.formTitle}>
                                Add New Subject
                            </h2>

                            <div className={styles.formRow}>
                                <div className={styles.formGroup}>
                                    <label>Subject Name</label>
                                    <input
                                        type="text"
                                        placeholder="e.g., Mathematics, English"
                                        value={name}
                                        onChange={(e) =>
                                            setName(e.target.value)
                                        }
                                        required
                                        className={styles.formInput}
                                    />
                                </div>

                                <div className={styles.formGroup}>
                                    <label>Subject Type</label>
                                    <select
                                        value={
                                            isLanguage === null
                                                ? ""
                                                : isLanguage
                                                  ? "true"
                                                  : "false"
                                        }
                                        onChange={(e) =>
                                            setIsLanguage(
                                                e.target.value === "true",
                                            )
                                        }
                                        required
                                        className={styles.formSelect}
                                    >
                                        <option value="" disabled>
                                            Select type
                                        </option>
                                        <option value="false">
                                            Other Subject
                                        </option>
                                        <option value="true">
                                            Language Subject
                                        </option>
                                    </select>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className={styles.submitButton}
                            >
                                <FiPlus />
                                {isLoading ? "Adding..." : "Add Subject"}
                            </button>
                        </form>
                    </div>
                )}

                {/* Search Bar */}
                <div className={styles.searchCard}>
                    <div className={styles.searchInputWrapper}>
                        <FiSearch className={styles.searchIcon} />
                        <input
                            type="text"
                            placeholder="Search subjects by name..."
                            value={searchTerm}
                            onChange={handleSearch}
                            className={styles.searchInput}
                        />
                    </div>
                </div>

                {/* Loading State */}
                {isLoading && subjects.length === 0 ? (
                    <div className={styles.loadingContainer}>
                        <div className={styles.spinner}></div>
                        <p>Loading subjects...</p>
                    </div>
                ) : filteredSubjects.length === 0 ? (
                    <div className={styles.emptyState}>
                        <FiBook className={styles.emptyIcon} />
                        <h3>No Subjects Found</h3>
                        <p>
                            {searchTerm
                                ? "Try adjusting your search"
                                : "Click 'Add Subject' to create your first subject"}
                        </p>
                    </div>
                ) : (
                    <>
                        {/* Language Subjects */}
                        {languageSubjects.length > 0 && (
                            <div className={styles.section}>
                                <div className={styles.sectionHeader}>
                                    <FiGlobe className={styles.sectionIcon} />
                                    <h2>Language Subjects</h2>
                                    <span className={styles.sectionCount}>
                                        {languageSubjects.length}
                                    </span>
                                </div>
                                <div className={styles.subjectsGrid}>
                                    {languageSubjects
                                        .slice()
                                        .sort((a, b) =>
                                            a.name.localeCompare(b.name),
                                        )
                                        .map((subj) => (
                                            <div
                                                key={subj._id}
                                                className={styles.card}
                                            >
                                                <div
                                                    className={
                                                        styles.cardHeader
                                                    }
                                                >
                                                    <div
                                                        className={`${styles.cardIcon} ${styles.cardIconLanguage}`}
                                                    >
                                                        <FiGlobe />
                                                    </div>
                                                    <h3
                                                        className={
                                                            styles.cardTitle
                                                        }
                                                    >
                                                        {subj.name}
                                                    </h3>
                                                </div>
                                                <div
                                                    className={styles.cardBody}
                                                >
                                                    <span
                                                        className={`${styles.badge} ${styles.badgeLanguage}`}
                                                    >
                                                        Language Subject
                                                    </span>
                                                </div>
                                                <div
                                                    className={
                                                        styles.cardFooter
                                                    }
                                                >
                                                    <button
                                                        onClick={() =>
                                                            deleteSubject(
                                                                subj._id,
                                                            )
                                                        }
                                                        className={
                                                            styles.deleteButton
                                                        }
                                                    >
                                                        <FiTrash2 />
                                                        Delete
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                </div>
                            </div>
                        )}

                        {/* Other Subjects */}
                        {otherSubjects.length > 0 && (
                            <div className={styles.section}>
                                <div className={styles.sectionHeader}>
                                    <FiBook className={styles.sectionIcon} />
                                    <h2>Other Subjects</h2>
                                    <span className={styles.sectionCount}>
                                        {otherSubjects.length}
                                    </span>
                                </div>
                                <div className={styles.subjectsGrid}>
                                    {otherSubjects
                                        .slice()
                                        .sort((a, b) =>
                                            a.name.localeCompare(b.name),
                                        )
                                        .map((subj) => (
                                            <div
                                                key={subj._id}
                                                className={styles.card}
                                            >
                                                <div
                                                    className={
                                                        styles.cardHeader
                                                    }
                                                >
                                                    <div
                                                        className={`${styles.cardIcon} ${styles.cardIconOther}`}
                                                    >
                                                        <FiBook />
                                                    </div>
                                                    <h3
                                                        className={
                                                            styles.cardTitle
                                                        }
                                                    >
                                                        {subj.name}
                                                    </h3>
                                                </div>
                                                <div
                                                    className={styles.cardBody}
                                                >
                                                    <span
                                                        className={`${styles.badge} ${styles.badgeOther}`}
                                                    >
                                                        Other Subject
                                                    </span>
                                                </div>
                                                <div
                                                    className={
                                                        styles.cardFooter
                                                    }
                                                >
                                                    <button
                                                        onClick={() =>
                                                            deleteSubject(
                                                                subj._id,
                                                            )
                                                        }
                                                        className={
                                                            styles.deleteButton
                                                        }
                                                    >
                                                        <FiTrash2 />
                                                        Delete
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                </div>
                            </div>
                        )}
                    </>
                )}
            </main>
        </div>
    );
}
