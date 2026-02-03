"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import styles from "./universities.module.css";
import {
    FiArrowLeft,
    FiPlus,
    FiEdit,
    FiTrash2,
    FiSearch,
    FiRefreshCw,
    FiMapPin,
    FiBook,
    FiHome,
} from "react-icons/fi";

export default function UniversitiesPage() {
    const [universities, setUniversities] = useState([]);
    const [filteredUniversities, setFilteredUniversities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [deleteId, setDeleteId] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const router = useRouter();

    useEffect(() => {
        fetchUniversities();
    }, []);

    useEffect(() => {
        const lowerSearch = searchTerm.toLowerCase();
        const results = universities.filter((uni) =>
            uni.title?.toLowerCase().includes(lowerSearch),
        );
        setFilteredUniversities(results);
    }, [searchTerm, universities]);

    const fetchUniversities = async () => {
        try {
            setIsRefreshing(true);
            setError(null);
            const res = await fetch("/api/universities");

            if (!res.ok) throw new Error("Failed to fetch universities");

            const data = await res.json();
            setUniversities(data || []);
            setFilteredUniversities(data || []);
        } catch (err) {
            console.error("Failed to fetch universities:", err);
            setError("Failed to load universities. Please try again.");
        } finally {
            setLoading(false);
            setIsRefreshing(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this university?"))
            return;

        try {
            setIsDeleting(true);
            const res = await fetch(`/api/universities?id=${id}`, {
                method: "DELETE",
            });

            if (!res.ok) throw new Error("Failed to delete");

            setUniversities((prev) => prev.filter((uni) => uni._id !== id));
            setDeleteId(null);
        } catch (err) {
            console.error("Failed to delete university:", err);
            setError("Failed to delete university");
        } finally {
            setIsDeleting(false);
        }
    };

    if (loading) {
        return (
            <div className={styles.container}>
                <div className={styles.loadingContainer}>
                    <div className={styles.spinner} />
                    <p>Loading universities...</p>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            {/* Header */}
            <header className={styles.header}>
                <button
                    className={styles.backButton}
                    onClick={() => router.push("/dashboard")}
                >
                    <FiArrowLeft />
                    <span>Back</span>
                </button>

                <div className={styles.titleContainer}>
                    <FiHome className={styles.titleIcon} />
                    <h2>Manage Universities</h2>
                </div>

                <div className={styles.headerActions}>
                    <button
                        className={styles.refreshButton}
                        onClick={fetchUniversities}
                        disabled={isRefreshing}
                    >
                        <FiRefreshCw
                            className={isRefreshing ? styles.spin : ""}
                        />
                        Refresh
                    </button>
                    <Link
                        href="/dashboard/universities/add"
                        className={styles.addButton}
                    >
                        <FiPlus />
                        Add University
                    </Link>
                </div>
            </header>

            {error && (
                <div className={styles.errorMessage}>
                    {error}
                    <button onClick={fetchUniversities}>Retry</button>
                </div>
            )}

            {/* Search Bar */}
            <div className={styles.searchBar}>
                <FiSearch className={styles.searchIcon} />
                <input
                    type="text"
                    placeholder="Search universities..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {/* Stats */}
            <div className={styles.statsBar}>
                <div className={styles.stat}>
                    <FiHome className={styles.statIcon} />
                    <span>{universities.length} Total Universities</span>
                </div>
            </div>

            {/* Universities Grid */}
            {filteredUniversities.length === 0 ? (
                <div className={styles.emptyState}>
                    <FiHome className={styles.emptyIcon} />
                    <h3>No Universities Found</h3>
                    <p>
                        {searchTerm
                            ? "Try a different search term"
                            : "Add your first university"}
                    </p>
                    {!searchTerm && (
                        <Link
                            href="/dashboard/universities/add"
                            className={styles.primaryButton}
                        >
                            <FiPlus /> Add University
                        </Link>
                    )}
                </div>
            ) : (
                <div className={styles.universityGrid}>
                    {filteredUniversities.map((university) => (
                        <div
                            key={university._id}
                            className={styles.universityCard}
                        >
                            {university.image && (
                                <div className={styles.universityImage}>
                                    <img
                                        src={university.image}
                                        alt={university.title}
                                    />
                                </div>
                            )}

                            <div className={styles.universityContent}>
                                <h3>{university.title}</h3>
                                <p className={styles.subtitle}>
                                    {university.subtitle}
                                </p>

                                {university.contact?.address && (
                                    <div className={styles.detail}>
                                        <FiMapPin
                                            className={styles.detailIcon}
                                        />
                                        <span>
                                            {university.contact.address}
                                        </span>
                                    </div>
                                )}

                                {university.stats?.courses && (
                                    <div className={styles.detail}>
                                        <FiBook className={styles.detailIcon} />
                                        <span>
                                            {university.stats.courses} Courses
                                        </span>
                                    </div>
                                )}

                                {university.stats?.campuses && (
                                    <div className={styles.detail}>
                                        <FiMapPin
                                            className={styles.detailIcon}
                                        />
                                        <span>
                                            {university.stats.campuses} Campuses
                                        </span>
                                    </div>
                                )}

                                <div
                                    className={
                                        university.isApplicationOpen
                                            ? styles.badgeOpen
                                            : styles.badgeClosed
                                    }
                                >
                                    {university.isApplicationOpen
                                        ? "✓ Applications Open"
                                        : "✗ Applications Closed"}
                                </div>
                            </div>

                            <div className={styles.actions}>
                                <Link
                                    href={`/dashboard/universities/${university._id}/edit`}
                                    className={styles.editButton}
                                    title="Edit university"
                                >
                                    <FiEdit />
                                </Link>
                                <button
                                    className={styles.deleteButton}
                                    onClick={() => handleDelete(university._id)}
                                    disabled={isDeleting}
                                    title="Delete university"
                                >
                                    <FiTrash2 />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
