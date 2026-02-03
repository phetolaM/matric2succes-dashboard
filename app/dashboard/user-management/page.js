"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./user-management.module.css";
import {
    FiArrowLeft,
    FiMail,
    FiUsers,
    FiDownload,
    FiSearch,
    FiRefreshCw,
    FiTrash2,
    FiX,
    FiCheck,
} from "react-icons/fi";

export default function UserManagementPage() {
    const [subscribers, setSubscribers] = useState([]);
    const [filteredSubscribers, setFilteredSubscribers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [emailToDelete, setEmailToDelete] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const router = useRouter();

    useEffect(() => {
        fetchSubscribers();
    }, []);

    useEffect(() => {
        const lowerSearch = searchTerm.toLowerCase();
        const results = subscribers.filter((sub) => {
            const emailStr = typeof sub === "string" ? sub : sub?.email;
            return (emailStr || "").toLowerCase().includes(lowerSearch);
        });
        setFilteredSubscribers(results);
    }, [searchTerm, subscribers]);

    const fetchSubscribers = async () => {
        try {
            setIsRefreshing(true);
            setError(null);
            const res = await fetch("/api/newsletter-subscribers");

            if (!res.ok) {
                throw new Error("Failed to fetch subscribers");
            }

            const data = await res.json();
            // Normalize data
            const normalized = (data || [])
                .map((item) => {
                    if (!item) return null;
                    if (typeof item === "string") {
                        return { email: item, subscribedAt: null };
                    }
                    return {
                        _id: item._id,
                        email: item.email,
                        subscribedAt: item.subscribedAt || null,
                    };
                })
                .filter(Boolean);

            setSubscribers(normalized);
            setFilteredSubscribers(normalized);
        } catch (err) {
            console.error("Failed to fetch subscribers:", err);
            setError("Failed to load subscribers. Please try again.");
        } finally {
            setLoading(false);
            setIsRefreshing(false);
        }
    };

    const handleExport = () => {
        const header = "email,subscribedAt\n";
        const rows = subscribers
            .map((s) => `${s.email},${s.subscribedAt || ""}`)
            .join("\n");
        const csvContent = "data:text/csv;charset=utf-8," + header + rows;
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute(
            "download",
            `newsletter_subscribers_${new Date().toISOString().split("T")[0]}.csv`,
        );
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const confirmDelete = (email) => {
        setEmailToDelete(email);
    };

    const cancelDelete = () => {
        setEmailToDelete(null);
    };

    const deleteEmail = async () => {
        if (!emailToDelete) return;

        try {
            setIsDeleting(true);
            const res = await fetch("/api/newsletter-subscribers", {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ email: emailToDelete }),
            });

            if (!res.ok) {
                throw new Error("Failed to delete subscriber");
            }

            setSubscribers(
                subscribers.filter((s) => s.email !== emailToDelete),
            );
            setEmailToDelete(null);
        } catch (err) {
            console.error("Failed to delete email:", err);
            setError("Failed to delete subscriber. Please try again.");
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <div className={styles.container}>
            {/* Header */}
            <header className={styles.header}>
                <button
                    className={styles.backButton}
                    onClick={() => router.push("/dashboard")}
                >
                    <FiArrowLeft />
                    <span>Back to Dashboard</span>
                </button>

                <div className={styles.titleContainer}>
                    <FiUsers className={styles.titleIcon} />
                    <h2>Newsletter Subscribers</h2>
                </div>

                <button
                    className={styles.refreshButton}
                    onClick={fetchSubscribers}
                    disabled={isRefreshing}
                >
                    <FiRefreshCw className={isRefreshing ? styles.spin : ""} />
                    {isRefreshing ? "Refreshing..." : "Refresh"}
                </button>
            </header>

            {error && (
                <div className={styles.errorMessage}>
                    {error}
                    <button onClick={fetchSubscribers}>Retry</button>
                </div>
            )}

            {/* Stats Card */}
            <div className={styles.statsCard}>
                <div className={styles.statItem}>
                    <FiMail className={styles.statIcon} />
                    <div>
                        <span className={styles.statLabel}>
                            Total Subscribers
                        </span>
                        <span className={styles.statValue}>
                            {subscribers.length}
                        </span>
                    </div>
                </div>
            </div>

            {/* Actions Bar */}
            <div className={styles.actionsBar}>
                <div className={styles.searchContainer}>
                    <FiSearch className={styles.searchIcon} />
                    <input
                        type="text"
                        placeholder="Search subscribers..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <button
                    className={styles.exportButton}
                    onClick={handleExport}
                    disabled={subscribers.length === 0}
                >
                    <FiDownload />
                    Export CSV
                </button>
            </div>

            {/* Subscribers List */}
            {loading ? (
                <div className={styles.loadingContainer}>
                    <div className={styles.spinner} />
                    <p>Loading subscribers...</p>
                </div>
            ) : (
                <div className={styles.emailListContainer}>
                    {filteredSubscribers.length === 0 ? (
                        <div className={styles.emptyState}>
                            <FiMail className={styles.emptyIcon} />
                            <p>No subscribers found</p>
                            {searchTerm && (
                                <button
                                    className={styles.clearSearchButton}
                                    onClick={() => setSearchTerm("")}
                                >
                                    Clear search
                                </button>
                            )}
                        </div>
                    ) : (
                        <ul className={styles.emailList}>
                            {filteredSubscribers.map((sub, idx) => (
                                <li
                                    key={sub._id || idx}
                                    className={styles.emailItem}
                                >
                                    <FiMail className={styles.emailIcon} />
                                    <span className={styles.emailAddress}>
                                        {sub.email}
                                    </span>
                                    <span className={styles.emailDate}>
                                        Joined{" "}
                                        {sub.subscribedAt
                                            ? new Date(
                                                  sub.subscribedAt,
                                              ).toLocaleDateString()
                                            : "-"}
                                    </span>
                                    <button
                                        className={styles.deleteButton}
                                        onClick={() => confirmDelete(sub.email)}
                                        disabled={isDeleting}
                                        title="Delete subscriber"
                                    >
                                        <FiTrash2 />
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {emailToDelete && (
                <div className={styles.modalOverlay}>
                    <div className={styles.deleteModal}>
                        <h3>Confirm Removal</h3>
                        <p>
                            Are you sure you want to remove{" "}
                            <strong>{emailToDelete}</strong> from the newsletter
                            subscribers?
                        </p>
                        <div className={styles.modalActions}>
                            <button
                                className={styles.cancelButton}
                                onClick={cancelDelete}
                                disabled={isDeleting}
                            >
                                <FiX />
                                Cancel
                            </button>
                            <button
                                className={styles.confirmDeleteButton}
                                onClick={deleteEmail}
                                disabled={isDeleting}
                            >
                                {isDeleting ? (
                                    <>
                                        <FiRefreshCw className={styles.spin} />
                                        Deleting...
                                    </>
                                ) : (
                                    <>
                                        <FiCheck />
                                        Confirm Delete
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
