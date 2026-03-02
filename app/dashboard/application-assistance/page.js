"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import styles from "./application-assistance.module.css";
import {
    FiArrowLeft,
    FiRefreshCw,
    FiSearch,
    FiSave,
    FiUser,
    FiCheckCircle,
    FiX,
    FiEdit3,
    FiAlertCircle,
    FiClock,
    FiList,
    FiCalendar,
    FiHash,
    FiLock,
    FiAward,
} from "react-icons/fi";

const PROGRESS_OPTIONS = ["Not Started", "Pending", "Done"];
const RESULT_OPTIONS = ["", "Accepted", "Rejected"];
const STUDENT_PROGRESS_OPTIONS = ["Not Started", "In Progress", "Done"];

function normalizeStudentProgress(value) {
    const normalized = String(value || "").trim().toLowerCase();
    if (normalized === "done") return "Done";
    if (normalized === "in progress" || normalized === "inprogress") return "In Progress";
    if (normalized === "pending") return "In Progress";
    return "Not Started";
}

function toDateInputValue(dateValue) {
    if (!dateValue) return "";
    const date = new Date(dateValue);
    if (Number.isNaN(date.getTime())) return "";
    return date.toISOString().split("T")[0];
}

function ProgressBadge({ value }) {
    const normalized = normalizeStudentProgress(value);
    const classMap = {
        "Done": styles.badgeDone,
        "In Progress": styles.badgeInProgress,
        "Not Started": styles.badgeNotStarted,
    };
    return (
        <span className={`${styles.badge} ${classMap[normalized] || styles.badgeNotStarted}`}>
            {normalized}
        </span>
    );
}

function UniStatusPill({ status }) {
    const cls =
        status === "Done" ? styles.pillDone
        : status === "Pending" ? styles.pillPending
        : styles.pillDefault;
    return <span className={`${styles.pill} ${cls}`}>{status || "Not Started"}</span>;
}

function ResultPill({ result }) {
    if (!result) return <span className={`${styles.pill} ${styles.pillDefault}`}>—</span>;
    const cls = result === "Accepted" ? styles.pillDone : styles.pillRejected;
    return <span className={`${styles.pill} ${cls}`}>{result}</span>;
}

function SkeletonCard() {
    return (
        <div className={styles.skeletonCard}>
            <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                <div className={styles.skeletonCircle} />
                <div style={{ flex: 1 }}>
                    <div className={styles.skeletonLine} style={{ width: "40%", height: "16px" }} />
                    <div className={styles.skeletonLine} style={{ width: "25%", height: "12px", marginTop: "8px" }} />
                </div>
                <div className={styles.skeletonLine} style={{ width: "80px", height: "32px", borderRadius: "8px" }} />
            </div>
        </div>
    );
}

export default function ApplicationAssistancePage() {
    const router = useRouter();

    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [studentProgressFilter, setStudentProgressFilter] = useState("Not Started");
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isSavingById, setIsSavingById] = useState({});
    const [saveSuccess, setSaveSuccess] = useState(false);

    /* modal state */
    const [modalClient, setModalClient] = useState(null);
    const [modalOpen, setModalOpen] = useState(false);

    const fetchClients = useCallback(async () => {
        try {
            setError("");
            setIsRefreshing(true);
            const res = await fetch("/api/application-assistance?paid=true", { cache: "no-store" });
            if (!res.ok) throw new Error("Failed to fetch");
            const data = await res.json();
            const normalized = (Array.isArray(data) ? data : []).map((c) => ({
                ...c,
                studentProgress: normalizeStudentProgress(c.studentProgress),
            }));
            setClients(normalized);
        } catch (e) {
            console.error(e);
            setError("Failed to load clients. Please try again.");
        } finally {
            setLoading(false);
            setIsRefreshing(false);
        }
    }, []);

    useEffect(() => { fetchClients(); }, [fetchClients]);

    useEffect(() => {
        const handleKey = (e) => { if (e.key === "Escape") closeModal(); };
        window.addEventListener("keydown", handleKey);
        return () => window.removeEventListener("keydown", handleKey);
    }, []);

    const openModal = (client) => {
        setModalClient(JSON.parse(JSON.stringify(client)));
        setModalOpen(true);
        document.body.style.overflow = "hidden";
    };

    const closeModal = () => {
        setModalOpen(false);
        document.body.style.overflow = "";
        setTimeout(() => setModalClient(null), 300);
    };

    const filteredClients = useMemo(() => {
        const term = searchTerm.trim().toLowerCase();
        return clients.filter((c) => {
            const matchesProgress = normalizeStudentProgress(c.studentProgress) === studentProgressFilter;
            if (!matchesProgress) return false;
            if (!term) return true;
            return (
                String(c.fullName || "").toLowerCase().includes(term) ||
                String(c.email || "").toLowerCase().includes(term) ||
                String(c.phoneNumber || "").toLowerCase().includes(term)
            );
        });
    }, [clients, searchTerm, studentProgressFilter]);

    const doneCount = useMemo(() =>
        clients.reduce((n, c) => n + (c.universityApplications || []).filter((u) => u.progressStatus === "Done").length, 0),
    [clients]);

    const totalTasks = useMemo(() =>
        clients.reduce((n, c) => n + (c.universityApplications || []).length, 0),
    [clients]);

    const progressCounts = useMemo(() => ({
        notStarted: clients.filter((c) => normalizeStudentProgress(c.studentProgress) === "Not Started").length,
        inProgress: clients.filter((c) => normalizeStudentProgress(c.studentProgress) === "In Progress").length,
        done: clients.filter((c) => normalizeStudentProgress(c.studentProgress) === "Done").length,
    }), [clients]);

    /* modal field updates */
    const updateUniField = (index, field, value) => {
        setModalClient((prev) => {
            const apps = [...(prev.universityApplications || [])];
            const next = { ...apps[index], [field]: value };
            if (field === "applicationResult" && value !== "Rejected") next.rejectionReason = "";
            apps[index] = next;
            return { ...prev, universityApplications: apps };
        });
    };

    const updateProgress = (value) => {
        setModalClient((prev) => ({
            ...prev,
            studentProgress: normalizeStudentProgress(value),
        }));
    };

    const saveModal = async () => {
        if (!modalClient) return;
        const clientId = modalClient._id;
        try {
            setError("");
            setIsSavingById((prev) => ({ ...prev, [clientId]: true }));
            const payload = {
                id: clientId,
                studentProgress: normalizeStudentProgress(modalClient.studentProgress),
                universityApplications: (modalClient.universityApplications || []).map((item) => ({
                    universityName: item.universityName || "",
                    appliedDate: item.appliedDate || null,
                    universityPIN: item.universityPIN || "",
                    studentNumber: item.studentNumber || "",
                    universityPassword: item.universityPassword || "",
                    progressStatus: item.progressStatus || "Not Started",
                    applicationResult: item.applicationResult || "",
                    rejectionReason: item.rejectionReason || "",
                })),
            };
            const res = await fetch("/api/application-assistance", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            if (!res.ok) throw new Error("Save failed");
            const updated = await res.json();
            const normalizedUpdated = {
                ...updated,
                studentProgress: normalizeStudentProgress(updated.studentProgress),
            };
            setClients((prev) => prev.map((c) => (c._id === clientId ? normalizedUpdated : c)));
            setSaveSuccess(true);
            setTimeout(() => setSaveSuccess(false), 2500);
            closeModal();
        } catch (e) {
            console.error(e);
            setError("Failed to save. Please retry.");
        } finally {
            setIsSavingById((prev) => ({ ...prev, [clientId]: false }));
        }
    };

    const isSavingModal = modalClient ? Boolean(isSavingById[modalClient._id]) : false;

    return (
        <div className={styles.root}>

            {/* ── TOP BAR ── */}
            <header className={styles.topBar}>
                <div className={styles.topBarInner}>
                    <button className={styles.backBtn} onClick={() => router.push("/dashboard")}>
                        <FiArrowLeft />
                        <span>Dashboard</span>
                    </button>
                    <div className={styles.topBarTitle}>
                        <h1>Work Board</h1>
                        <span className={styles.topBarSub}>Application Assistance</span>
                    </div>
                    <button
                        className={`${styles.refreshBtn} ${isRefreshing ? styles.spinning : ""}`}
                        onClick={fetchClients}
                        disabled={isRefreshing}
                    >
                        <FiRefreshCw />
                        <span>{isRefreshing ? "Refreshing…" : "Refresh"}</span>
                    </button>
                </div>
            </header>

            <main className={styles.main}>

                {/* ── BANNERS ── */}
                {error && (
                    <div className={styles.errorBanner}>
                        <FiAlertCircle />
                        {error}
                        <button className={styles.bannerClose} onClick={() => setError("")}><FiX /></button>
                    </div>
                )}
                {saveSuccess && (
                    <div className={styles.successBanner}>
                        <FiCheckCircle />
                        Changes saved successfully.
                    </div>
                )}

                {/* ── STATS ── */}
                <div className={styles.statsRow}>
                    {[
                        { label: "Total Clients",      value: clients.length,     color: "#00563b", icon: <FiUser /> },
                        { label: "Not Started",         value: progressCounts.notStarted, color: "#6b7280", icon: <FiClock /> },
                        { label: "In Progress",         value: progressCounts.inProgress, color: "#ea580c", icon: <FiClock /> },
                        { label: "Completed",           value: progressCounts.done, color: "#00563b", icon: <FiCheckCircle /> },
                        { label: "University Tasks",    value: totalTasks,         color: "#6366f1", icon: <FiList /> },
                        { label: "Tasks Done",          value: doneCount,          color: "#00563b", icon: <FiCheckCircle /> },
                    ].map((s, i) => (
                        <div key={s.label} className={styles.statCard} style={{ animationDelay: `${i * 0.06}s` }}>
                            <div className={styles.statIconWrap} style={{ background: `${s.color}14`, color: s.color }}>
                                {s.icon}
                            </div>
                            <div>
                                <p className={styles.statLabel}>{s.label}</p>
                                <strong className={styles.statValue}>{s.value}</strong>
                            </div>
                        </div>
                    ))}
                </div>

                {/* ── TOOLBAR ── */}
                <div className={styles.toolbar}>
                    <div className={styles.searchWrap}>
                        <FiSearch className={styles.searchIcon} />
                        <input
                            className={styles.searchInput}
                            placeholder="Search by name, email, or phone…"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        {searchTerm && (
                            <button className={styles.searchClear} onClick={() => setSearchTerm("")}><FiX /></button>
                        )}
                    </div>
                    <div className={styles.filterTabs}>
                        {STUDENT_PROGRESS_OPTIONS.map((opt) => (
                            <button
                                key={opt}
                                className={`${styles.filterTab} ${studentProgressFilter === opt ? styles.filterTabActive : ""}`}
                                onClick={() => setStudentProgressFilter(opt)}
                            >
                                {opt}
                                <span className={styles.filterCount}>
                                    {opt === "Not Started" && progressCounts.notStarted}
                                    {opt === "In Progress" && progressCounts.inProgress}
                                    {opt === "Done" && progressCounts.done}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* ── CLIENT LIST ── */}
                {loading ? (
                    <div className={styles.skeletonList}>
                        {[1,2,3,4,5].map((n) => <SkeletonCard key={n} />)}
                    </div>
                ) : filteredClients.length === 0 ? (
                    <div className={styles.emptyState}>
                        <FiUser className={styles.emptyIcon} />
                        <p>No clients found for this filter.</p>
                    </div>
                ) : (
                    <div className={styles.clientList}>
                        {filteredClients.map((client, i) => {
                            const apps = client.universityApplications || [];
                            const done = apps.filter((u) => u.progressStatus === "Done").length;
                            const pct = apps.length > 0 ? Math.round((done / apps.length) * 100) : 0;
                            return (
                                <div
                                    key={client._id}
                                    className={styles.clientRow}
                                    style={{ animationDelay: `${i * 0.04}s` }}
                                >
                                    <div className={styles.clientRowLeft}>
                                        <div className={styles.clientAvatar}>
                                            {(client.fullName || "?")[0].toUpperCase()}
                                        </div>
                                        <div className={styles.clientInfo}>
                                            <h3 className={styles.clientName}>{client.fullName}</h3>
                                            <p className={styles.clientMeta}>{client.email}</p>
                                            <p className={styles.clientMeta}>
                                                {client.phoneNumber || "No phone"} · {client.planName || client.planId || "N/A"}
                                            </p>
                                        </div>
                                    </div>

                                    <div className={styles.clientRowMid}>
                                        <ProgressBadge value={client.studentProgress} />
                                        <div className={styles.progressBarWrap}>
                                            <div className={styles.progressBarTrack}>
                                                <div className={styles.progressBarFill} style={{ width: `${pct}%` }} />
                                            </div>
                                            <span className={styles.progressBarLabel}>{done}/{apps.length}</span>
                                        </div>
                                    </div>

                                    <div className={styles.clientRowRight}>
                                        <span className={styles.amountTag}>{client.currency || "R"}{client.amount || 0}</span>
                                        <span className={styles.paidBadge}>Paid</span>
                                        <button className={styles.editBtn} onClick={() => openModal(client)}>
                                            <FiEdit3 />
                                            Edit
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </main>

            {/* ══════════════════════════════════════════
                FULL-PAGE MODAL
            ══════════════════════════════════════════ */}
            {(modalOpen || modalClient) && (
                <>
                    <div
                        className={`${styles.overlay} ${modalOpen ? styles.overlayVisible : ""}`}
                        onClick={closeModal}
                    />

                    <div className={`${styles.modal} ${modalOpen ? styles.modalOpen : ""}`}>
                        {modalClient && (
                            <div className={styles.modalInner}>

                                {/* ── Modal Header ── */}
                                <div className={styles.modalHeader}>
                                    <div className={styles.modalHeaderLeft}>
                                        <div className={styles.modalAvatar}>
                                            {(modalClient.fullName || "?")[0].toUpperCase()}
                                        </div>
                                        <div>
                                            <p className={styles.modalEyebrow}>Editing client</p>
                                            <h2 className={styles.modalTitle}>{modalClient.fullName}</h2>
                                            <p className={styles.modalSub}>
                                                {modalClient.email} · {modalClient.phoneNumber || "No phone"}
                                            </p>
                                        </div>
                                    </div>
                                    <button className={styles.modalClose} onClick={closeModal}>
                                        <FiX />
                                    </button>
                                </div>

                                {/* ── Client info strip ── */}
                                <div className={styles.modalInfoStrip}>
                                    <div className={styles.infoStripItem}>
                                        <span className={styles.infoStripLabel}>Plan</span>
                                        <span className={styles.infoStripValue}>{modalClient.planName || modalClient.planId || "N/A"}</span>
                                    </div>
                                    <div className={styles.infoStripDivider} />
                                    <div className={styles.infoStripItem}>
                                        <span className={styles.infoStripLabel}>Reference</span>
                                        <span className={styles.infoStripValue}>{modalClient.paymentReference || "N/A"}</span>
                                    </div>
                                    <div className={styles.infoStripDivider} />
                                    <div className={styles.infoStripItem}>
                                        <span className={styles.infoStripLabel}>Amount Paid</span>
                                        <span className={`${styles.infoStripValue} ${styles.infoStripGreen}`}>
                                            {modalClient.currency || "R"}{modalClient.amount || 0}
                                        </span>
                                    </div>
                                    <div className={styles.infoStripDivider} />
                                    <div className={styles.infoStripItem}>
                                        <span className={styles.infoStripLabel}>Universities</span>
                                        <span className={styles.infoStripValue}>
                                            {(modalClient.universityApplications || []).length}
                                        </span>
                                    </div>
                                </div>

                                {/* ── Scrollable body ── */}
                                <div className={styles.modalBody}>

                                    {/* ── Overall progress ── */}
                                    <div className={styles.modalSection}>
                                        <h3 className={styles.modalSectionTitle}>Overall Student Progress</h3>
                                        <div className={styles.progressBtns}>
                                            {STUDENT_PROGRESS_OPTIONS.map((opt) => (
                                                <button
                                                    key={opt}
                                                    className={`${styles.progressOptBtn} ${
                                                        normalizeStudentProgress(modalClient.studentProgress) === opt
                                                            ? styles.progressOptBtnActive : ""
                                                    }`}
                                                    onClick={() => updateProgress(opt)}
                                                >
                                                    {opt}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* ── Universities ── */}
                                    <div className={styles.modalSection}>
                                        <div className={styles.uniSectionHeader}>
                                            <h3 className={styles.modalSectionTitle}>University Applications</h3>
                                            <span className={styles.uniCount}>
                                                {(modalClient.universityApplications || []).length} universities
                                            </span>
                                        </div>

                                        <div className={styles.uniGrid}>
                                            {(modalClient.universityApplications || []).map((item, index) => (
                                                <div key={`${item.universityName}-${index}`} className={styles.uniCard}>

                                                    {/* Card top bar */}
                                                    <div className={styles.uniCardTop}>
                                                        <div className={styles.uniCardTopLeft}>
                                                            <div className={styles.uniIndexBadge}>{String(index + 1).padStart(2, "0")}</div>
                                                            <div>
                                                                <h4 className={styles.uniName}>{item.universityName}</h4>
                                                                <div className={styles.uniPillRow}>
                                                                    <UniStatusPill status={item.progressStatus} />
                                                                    <ResultPill result={item.applicationResult} />
                                                                </div>
                                                            </div>
                                                        </div>
                                                        {/* Quick progress select */}
                                                        <select
                                                            className={`${styles.uniQuickSelect} ${
                                                                item.progressStatus === "Done" ? styles.selectDone
                                                                : item.progressStatus === "Pending" ? styles.selectPending
                                                                : styles.selectDefault
                                                            }`}
                                                            value={item.progressStatus || "Not Started"}
                                                            onChange={(e) => updateUniField(index, "progressStatus", e.target.value)}
                                                        >
                                                            {PROGRESS_OPTIONS.map((opt) => (
                                                                <option key={opt} value={opt}>{opt}</option>
                                                            ))}
                                                        </select>
                                                    </div>

                                                    {/* Fields grid */}
                                                    <div className={styles.uniFieldsGrid}>

                                                        {/* Applied date */}
                                                        <div className={styles.uniFieldGroup}>
                                                            <label className={styles.uniFieldLabel}>
                                                                <FiCalendar className={styles.uniFieldIcon} />
                                                                Applied Date
                                                            </label>
                                                            <input
                                                                type="date"
                                                                className={styles.uniFieldInput}
                                                                value={toDateInputValue(item.appliedDate)}
                                                                onChange={(e) => updateUniField(index, "appliedDate", e.target.value || null)}
                                                            />
                                                        </div>

                                                        {/* PIN */}
                                                        <div className={styles.uniFieldGroup}>
                                                            <label className={styles.uniFieldLabel}>
                                                                <FiHash className={styles.uniFieldIcon} />
                                                                University PIN
                                                            </label>
                                                            <input
                                                                type="text"
                                                                className={styles.uniFieldInput}
                                                                placeholder="e.g. 12345"
                                                                value={item.universityPIN || ""}
                                                                onChange={(e) => updateUniField(index, "universityPIN", e.target.value)}
                                                            />
                                                        </div>

                                                        {/* Student number */}
                                                        <div className={styles.uniFieldGroup}>
                                                            <label className={styles.uniFieldLabel}>
                                                                <FiUser className={styles.uniFieldIcon} />
                                                                Student Number
                                                            </label>
                                                            <input
                                                                type="text"
                                                                className={styles.uniFieldInput}
                                                                placeholder="e.g. 202301234"
                                                                value={item.studentNumber || ""}
                                                                onChange={(e) => updateUniField(index, "studentNumber", e.target.value)}
                                                            />
                                                        </div>

                                                        {/* Password */}
                                                        <div className={styles.uniFieldGroup}>
                                                            <label className={styles.uniFieldLabel}>
                                                                <FiLock className={styles.uniFieldIcon} />
                                                                Portal Password
                                                            </label>
                                                            <input
                                                                type="text"
                                                                className={styles.uniFieldInput}
                                                                placeholder="Portal password"
                                                                value={item.universityPassword || ""}
                                                                onChange={(e) => updateUniField(index, "universityPassword", e.target.value)}
                                                            />
                                                        </div>

                                                        {/* Result */}
                                                        <div className={styles.uniFieldGroup}>
                                                            <label className={styles.uniFieldLabel}>
                                                                <FiAward className={styles.uniFieldIcon} />
                                                                Application Result
                                                            </label>
                                                            <select
                                                                className={`${styles.uniFieldInput} ${
                                                                    item.applicationResult === "Accepted" ? styles.selectDone
                                                                    : item.applicationResult === "Rejected" ? styles.selectRejected
                                                                    : styles.selectDefault
                                                                }`}
                                                                value={item.applicationResult || ""}
                                                                onChange={(e) => updateUniField(index, "applicationResult", e.target.value)}
                                                            >
                                                                {RESULT_OPTIONS.map((opt) => (
                                                                    <option key={opt || "blank"} value={opt}>{opt || "Pending"}</option>
                                                                ))}
                                                            </select>
                                                        </div>

                                                        {/* Rejection reason — only when rejected */}
                                                        {item.applicationResult === "Rejected" && (
                                                            <div className={`${styles.uniFieldGroup} ${styles.uniFieldGroupFull}`}>
                                                                <label className={styles.uniFieldLabel}>
                                                                    <FiAlertCircle className={styles.uniFieldIcon} />
                                                                    Rejection Reason
                                                                </label>
                                                                <input
                                                                    type="text"
                                                                    className={`${styles.uniFieldInput} ${styles.inputRejected}`}
                                                                    placeholder="Enter reason for rejection…"
                                                                    value={item.rejectionReason || ""}
                                                                    onChange={(e) => updateUniField(index, "rejectionReason", e.target.value)}
                                                                />
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* ── Modal Footer ── */}
                                <div className={styles.modalFooter}>
                                    <button className={styles.cancelBtn} onClick={closeModal}>
                                        Cancel
                                    </button>
                                    <button className={styles.saveBtn} onClick={saveModal} disabled={isSavingModal}>
                                        <FiSave />
                                        {isSavingModal ? "Saving…" : "Save changes"}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}