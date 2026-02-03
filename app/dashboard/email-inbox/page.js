"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import styles from "./email-inbox.module.css";
import {
    FiArrowLeft,
    FiMail,
    FiTrash2,
    FiClock,
    FiUser,
    FiInbox,
} from "react-icons/fi";

export default function EmailInbox() {
    const [loading, setLoading] = useState(true);
    const [emails, setEmails] = useState([]);
    const [error, setError] = useState(null);
    const [selected, setSelected] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const router = useRouter();
    const bodyOverflowRef = useRef("");

    // Prevent background scrolling when modal is open
    useEffect(() => {
        try {
            if (isModalOpen) {
                bodyOverflowRef.current = document.body.style.overflow || "";
                document.body.style.overflow = "hidden";
                document.body.style.touchAction = "none";
            } else {
                document.body.style.overflow = bodyOverflowRef.current || "";
                document.body.style.touchAction = "";
            }
        } catch (err) {
            console.warn("Could not toggle body overflow", err);
        }

        return () => {
            try {
                document.body.style.overflow = bodyOverflowRef.current || "";
                document.body.style.touchAction = "";
            } catch (err) {
                /* ignore */
            }
        };
    }, [isModalOpen]);

    // Fetch inbox emails
    useEffect(() => {
        let mounted = true;
        const fetchInbox = async () => {
            try {
                const res = await fetch("/api/contact/inbox");
                if (!res.ok) {
                    const errorData = await res.json();
                    if (mounted) {
                        setError(errorData?.message || "Failed to load inbox");
                    }
                } else {
                    const data = await res.json();
                    if (mounted) setEmails(data || []);
                }
            } catch (err) {
                if (mounted) {
                    setError("Failed to load inbox");
                    console.error("Error fetching inbox:", err);
                }
            } finally {
                if (mounted) setLoading(false);
            }
        };
        fetchInbox();
        return () => {
            mounted = false;
        };
    }, []);

    const openEmail = (email) => {
        setSelected(email);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setSelected(null);
    };

    const confirmAndOpenMailTo = (emailAddr) => {
        const ok = window.confirm(
            `Open your mail client to message ${emailAddr}?`,
        );
        if (ok) window.location.href = `mailto:${emailAddr}`;
    };

    const handleDelete = async (id) => {
        if (!id) return;
        if (
            !window.confirm(
                "Are you sure you want to delete this message? This action cannot be undone.",
            )
        )
            return;
        setDeleting(true);
        try {
            const res = await fetch(`/api/contact/inbox/${id}`, {
                method: "DELETE",
            });
            if (!res.ok) throw new Error("Failed to delete");
            setEmails((prev) => prev.filter((x) => x._id !== id));
            closeModal();
        } catch (err) {
            console.error("Failed to delete:", err);
            alert("Failed to delete message");
        } finally {
            setDeleting(false);
        }
    };

    if (loading) {
        return (
            <div className={styles.container}>
                <div className={styles.loadingContainer}>
                    <div className={styles.spinner} />
                    <p>Loading inbox...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className={styles.container}>
                <div className={styles.errorContainer}>
                    <p>{error}</p>
                    <button onClick={() => window.location.reload()}>
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            {/* Header */}
            <header className={styles.header}>
                <div className={styles.headerContent}>
                    <button
                        className={styles.backButton}
                        onClick={() => router.push("/dashboard")}
                        aria-label="Go back to dashboard"
                    >
                        <FiArrowLeft />
                        <span>Back</span>
                    </button>
                    <div className={styles.headerTitle}>
                        <FiInbox className={styles.headerIcon} />
                        <div>
                            <h1>Email Inbox</h1>
                            <p>
                                Manage and respond to customer inquiries in one
                                place
                            </p>
                        </div>
                    </div>
                </div>
            </header>

            <main className={styles.main}>
                {/* Stats Card */}
                <div className={styles.statsCard}>
                    <div className={styles.statContent}>
                        <span className={styles.statLabel}>Total Messages</span>
                        <span className={styles.statValue}>
                            {emails.length}
                        </span>
                    </div>
                    <FiMail className={styles.statIcon} />
                </div>

                {/* Emails List */}
                {emails.length === 0 ? (
                    <div className={styles.emptyState}>
                        <FiInbox className={styles.emptyIcon} />
                        <h3>No Messages Yet</h3>
                        <p>
                            Your inbox is empty. New messages will appear here.
                        </p>
                    </div>
                ) : (
                    <div className={styles.emailsCard}>
                        <div className={styles.emailsHeader}>
                            <h2>Messages</h2>
                            <span className={styles.emailsCount}>
                                {emails.length}{" "}
                                {emails.length === 1 ? "message" : "messages"}
                            </span>
                        </div>

                        <div className={styles.emailsList}>
                            {emails.map((e, idx) => {
                                const date = e.receivedAt
                                    ? new Date(e.receivedAt)
                                    : null;
                                const dateStr = date
                                    ? date.toLocaleDateString("en-US", {
                                          year: "numeric",
                                          month: "short",
                                          day: "numeric",
                                      })
                                    : "";
                                const timeStr = date
                                    ? date.toLocaleTimeString("en-US", {
                                          hour: "2-digit",
                                          minute: "2-digit",
                                      })
                                    : "";

                                return (
                                    <div
                                        key={e._id || idx}
                                        className={styles.emailItem}
                                        onClick={() => openEmail(e)}
                                    >
                                        <div className={styles.emailHeader}>
                                            <div
                                                className={styles.emailSubject}
                                            >
                                                <FiMail
                                                    className={styles.emailIcon}
                                                />
                                                <span>
                                                    {e.subject ||
                                                        "(no subject)"}
                                                </span>
                                            </div>
                                            <div className={styles.emailDate}>
                                                <FiClock
                                                    className={styles.dateIcon}
                                                />
                                                <span>
                                                    {dateStr}
                                                    {timeStr && (
                                                        <small>
                                                            {" "}
                                                            {timeStr}
                                                        </small>
                                                    )}
                                                </span>
                                            </div>
                                        </div>
                                        <div className={styles.emailMeta}>
                                            <div className={styles.emailFrom}>
                                                <FiUser />
                                                <span>
                                                    {e.name || "Unknown"}
                                                </span>
                                            </div>
                                            {e.email && (
                                                <div
                                                    className={
                                                        styles.emailAddress
                                                    }
                                                >
                                                    {e.email}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </main>

            {/* Email Detail Modal */}
            {isModalOpen && selected && (
                <div className={styles.modalOverlay} onClick={closeModal}>
                    <div
                        className={styles.modal}
                        role="dialog"
                        aria-modal="true"
                        onClick={(ev) => ev.stopPropagation()}
                    >
                        <div className={styles.modalHeader}>
                            <h3>{selected.subject || "(no subject)"}</h3>
                            <button
                                className={styles.modalClose}
                                onClick={closeModal}
                            >
                                ✕
                            </button>
                        </div>

                        <div className={styles.modalBody}>
                            <div className={styles.modalMeta}>
                                <div className={styles.modalMetaItem}>
                                    <FiUser />
                                    <div>
                                        <strong>From:</strong> {selected.name}
                                    </div>
                                </div>
                                <div className={styles.modalMetaItem}>
                                    <FiMail />
                                    <div>
                                        <strong>Email:</strong>{" "}
                                        {selected.email ? (
                                            <a
                                                href={`mailto:${selected.email}`}
                                                onClick={(ev) => {
                                                    ev.stopPropagation();
                                                    ev.preventDefault();
                                                    confirmAndOpenMailTo(
                                                        selected.email,
                                                    );
                                                }}
                                                className={styles.emailLink}
                                            >
                                                {selected.email}
                                            </a>
                                        ) : (
                                            "N/A"
                                        )}
                                    </div>
                                </div>
                                <div className={styles.modalMetaItem}>
                                    <FiClock />
                                    <div>
                                        <strong>Received:</strong>{" "}
                                        {selected.receivedAt
                                            ? new Date(
                                                  selected.receivedAt,
                                              ).toLocaleString()
                                            : "N/A"}
                                    </div>
                                </div>
                            </div>

                            <div className={styles.modalMessage}>
                                <h4>Message:</h4>
                                <p>{selected.message}</p>
                            </div>
                        </div>

                        <div className={styles.modalFooter}>
                            <button
                                className={styles.modalBackButton}
                                onClick={closeModal}
                                disabled={deleting}
                            >
                                Back
                            </button>
                            <button
                                className={styles.modalDeleteButton}
                                onClick={() => handleDelete(selected._id)}
                                disabled={deleting}
                            >
                                {deleting ? (
                                    <>
                                        <div className={styles.spinner} />
                                        Deleting...
                                    </>
                                ) : (
                                    <>
                                        <FiTrash2 />
                                        Delete Message
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
