"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FaUniversity } from "react-icons/fa";
import {
    FiAlertCircle,
    FiArrowLeft,
    FiRefreshCw,
    FiSearch,
} from "react-icons/fi";
import styles from "./page.module.css";

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

export default function CourseCollectionPage() {
    const router = useRouter();
    const [collections, setCollections] = useState([]);
    const [filteredCollections, setFilteredCollections] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        fetchCollections();
    }, []);

    useEffect(() => {
        const term = searchTerm.trim().toLowerCase();
        const results = collections.filter((name) => {
            const display = getUniversityDisplayName(name).toLowerCase();
            return name.toLowerCase().includes(term) || display.includes(term);
        });
        setFilteredCollections(results);
    }, [searchTerm, collections]);

    const fetchCollections = async () => {
        try {
            setIsRefreshing(true);
            setError("");
            const res = await fetch("/api/course-collections", {
                cache: "no-store",
            });

            if (!res.ok) throw new Error("Failed to fetch course collections");

            const data = await res.json();
            setCollections(data || []);
            setFilteredCollections(data || []);
        } catch (err) {
            console.error("Failed to fetch course collections:", err);
            setError(
                err?.message || "Unable to load course collections right now.",
            );
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    };

    const handleCardClick = (name) => {
        router.push(`/admin/course-collection/${name}`);
    };

    const handleRetry = () => {
        setSearchTerm("");
        fetchCollections();
    };

    const renderGrid = () => {
        if (isLoading) {
            return (
                <div className={styles.grid}>
                    {Array.from({ length: 9 }).map((_, idx) => (
                        <div key={idx} className={styles.cardSkeleton} />
                    ))}
                </div>
            );
        }

        if (filteredCollections.length === 0) {
            return (
                <div className={styles.emptyState}>
                    <p>No universities match your search.</p>
                </div>
            );
        }

        return (
            <div className={styles.grid}>
                {filteredCollections
                    .slice()
                    .sort((a, b) =>
                        getUniversityDisplayName(a).localeCompare(
                            getUniversityDisplayName(b),
                        ),
                    )
                    .map((name) => (
                        <button
                            type="button"
                            key={name}
                            className={styles.card}
                            onClick={() => handleCardClick(name)}
                        >
                            <div className={styles.cardHeader}>
                                <span className={styles.iconWrap}>
                                    <FaUniversity />
                                </span>
                                <span className={styles.collectionCode}>
                                    {name?.toUpperCase()}
                                </span>
                            </div>
                            <h3 className={styles.cardTitle}>
                                {getUniversityDisplayName(name)}
                            </h3>
                            <div className={styles.cardFooter}>
                                <span>View courses</span>
                                <span aria-hidden>→</span>
                            </div>
                        </button>
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
                        onClick={() => router.push("/dashboard")}
                        type="button"
                    >
                        <FiArrowLeft />
                        <span>Back to Dashboard</span>
                    </button>

                    <div className={styles.titleBlock}>
                        <div className={styles.titleIcon}>
                            <FaUniversity />
                        </div>
                        <div>
                            <p className={styles.titleLabel}>
                                Course Collections
                            </p>
                            <h1 className={styles.title}>
                                Available Universities
                            </h1>
                        </div>
                    </div>

                    <button
                        className={styles.refreshButton}
                        onClick={fetchCollections}
                        disabled={isRefreshing}
                        type="button"
                    >
                        <FiRefreshCw
                            className={isRefreshing ? styles.spin : undefined}
                        />
                        <span>{isRefreshing ? "Refreshing" : "Refresh"}</span>
                    </button>
                </header>

                <div className={styles.statsBar}>
                    <div className={styles.statItem}>
                        <span className={styles.statLabel}>
                            Total Universities
                        </span>
                        <span className={styles.statValue}>
                            {collections.length}
                        </span>
                    </div>
                    {searchTerm && (
                        <div className={styles.statItem}>
                            <span className={styles.statLabel}>
                                Showing Results
                            </span>
                            <span className={styles.statValue}>
                                {filteredCollections.length}
                            </span>
                        </div>
                    )}
                </div>

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

                <div className={styles.searchContainer}>
                    <FiSearch className={styles.searchIconNew} />
                    <input
                        className={styles.searchInput}
                        type="text"
                        placeholder="Search universities..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{ color: "#000000", backgroundColor: "#ffffff" }}
                    />
                </div>

                {renderGrid()}
            </div>
        </div>
    );
}
