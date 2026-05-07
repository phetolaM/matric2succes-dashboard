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
    FiMail,
    FiAlertTriangle,
    FiDollarSign,
    FiFileText,
} from "react-icons/fi";

/* ─────────────────────────────────────────────────
   CONSTANTS
───────────────────────────────────────────────── */

const PROGRESS_OPTIONS        = ["Not Started", "Pending", "Done"];
const APPLICATION_STATUS_OPTIONS = ["Not Applied", "Applied", "Accepted", "Rejected"];
const STUDENT_PROGRESS_OPTIONS = ["Not Started", "In Progress", "Done"];

/* ─────────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────────── */

function normalizeStudentProgress(value) {
    const n = String(value || "").trim().toLowerCase();
    if (n === "done") return "Done";
    if (n === "in progress" || n === "inprogress" || n === "pending") return "In Progress";
    return "Not Started";
}

function toDateInputValue(dateValue) {
    if (!dateValue) return "";
    const d = new Date(dateValue);
    if (Number.isNaN(d.getTime())) return "";
    return d.toISOString().split("T")[0];
}

function formatCurrency(amount, currency = "R") {
    const n = Number(amount) || 0;
    return `${currency}${n.toLocaleString("en-ZA")}`;
}

/* ─────────────────────────────────────────────────
   MICRO COMPONENTS
───────────────────────────────────────────────── */

function ProgressBadge({ value }) {
    const normalized = normalizeStudentProgress(value);
    const classMap = {
        "Done":        styles.badgeDone,
        "In Progress": styles.badgeInProgress,
        "Not Started": styles.badgeNotStarted,
    };
    return (
        <span className={`${styles.badge} ${classMap[normalized] || styles.badgeNotStarted}`}>
            {normalized}
        </span>
    );
}

function AppStatusPill({ status }) {
    const map = {
        "Applied":     styles.pillPending,
        "Accepted":    styles.pillDone,
        "Rejected":    styles.pillRejected,
        "Not Applied": styles.pillNotApplied,
    };
    return (
        <span className={`${styles.pill} ${map[status] || styles.pillDefault}`}>
            {status || "Not Applied"}
        </span>
    );
}

function UniStatusPill({ status }) {
    const cls =
        status === "Done" ? styles.pillDone :
        status === "Pending" ? styles.pillPending :
        styles.pillDefault;
    return <span className={`${styles.pill} ${cls}`}>{status || "Not Started"}</span>;
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

/* ─────────────────────────────────────────────────
   MAIN PAGE
───────────────────────────────────────────────── */

export default function ApplicationAssistancePage() {
    const router = useRouter();

    const [clients,              setClients]              = useState([]);
    const [loading,              setLoading]              = useState(true);
    const [error,                setError]                = useState("");
    const [searchTerm,           setSearchTerm]           = useState("");
    const [studentProgressFilter,setStudentProgressFilter]= useState("Not Started");
    const [isRefreshing,         setIsRefreshing]         = useState(false);
    const [isSavingById,         setIsSavingById]         = useState({});
    const [saveSuccess,          setSaveSuccess]          = useState(false);

    /* modal */
    const [modalClient, setModalClient] = useState(null);
    const [modalOpen,   setModalOpen]   = useState(false);

    /* ── fetch ── */
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
                universityApplications: (c.universityApplications || []).map((u) => ({
                    // Defaults for new fields that may not exist yet
                    applicationStatus: "Not Applied",
                    applicationEmail:  "",
                    studentNumber:     u.studentNumber || "",
                    universityPIN:     u.universityPIN || "",
                    universityPassword:u.universityPassword || "",
                    appliedDate:       u.appliedDate || null,
                    applicationResult: u.applicationResult || "",
                    rejectionReason:   u.rejectionReason || "",
                    progressStatus:    u.progressStatus || "Not Started",
                    notes:             u.notes || "",
                    ...u, // real data overwrites defaults
                })),
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
        const onKey = (e) => { if (e.key === "Escape") closeModal(); };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, []);

    /* ── modal helpers ── */
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

    /* ── derived stats ── */
    const totalRevenue = useMemo(() =>
        clients.reduce((sum, c) => sum + (Number(c.amount) || 0), 0),
    [clients]);

    const totalUniTasks = useMemo(() =>
        clients.reduce((n, c) => n + (c.universityApplications || []).length, 0),
    [clients]);

    const notAppliedCount = useMemo(() =>
        clients.reduce((n, c) =>
            n + (c.universityApplications || []).filter(
                (u) => (u.applicationStatus || "Not Applied") === "Not Applied"
            ).length, 0),
    [clients]);

    const acceptedCount = useMemo(() =>
        clients.reduce((n, c) =>
            n + (c.universityApplications || []).filter(
                (u) => u.applicationStatus === "Accepted"
            ).length, 0),
    [clients]);

    const progressCounts = useMemo(() => ({
        notStarted: clients.filter((c) => normalizeStudentProgress(c.studentProgress) === "Not Started").length,
        inProgress: clients.filter((c) => normalizeStudentProgress(c.studentProgress) === "In Progress").length,
        done:       clients.filter((c) => normalizeStudentProgress(c.studentProgress) === "Done").length,
    }), [clients]);

    /* pending unapplied list for urgent banner */
    const urgentUnapplied = useMemo(() => {
        const items = [];
        clients.forEach((c) => {
            (c.universityApplications || []).forEach((u) => {
                if ((u.applicationStatus || "Not Applied") === "Not Applied") {
                    items.push({ client: c.fullName, uni: u.universityName });
                }
            });
        });
        return items.slice(0, 8);
    }, [clients]);

    /* ── filtered list ── */
    const filteredClients = useMemo(() => {
        const term = searchTerm.trim().toLowerCase();
        return clients.filter((c) => {
            if (normalizeStudentProgress(c.studentProgress) !== studentProgressFilter) return false;
            if (!term) return true;
            return (
                String(c.fullName    || "").toLowerCase().includes(term) ||
                String(c.email       || "").toLowerCase().includes(term) ||
                String(c.phoneNumber || "").toLowerCase().includes(term)
            );
        });
    }, [clients, searchTerm, studentProgressFilter]);

    /* ── modal field update ── */
    const updateUniField = (index, field, value) => {
        setModalClient((prev) => {
            const apps = [...(prev.universityApplications || [])];
            const next = { ...apps[index], [field]: value };
            if (field === "applicationStatus" && value !== "Rejected") next.rejectionReason = "";
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

    /* ── save ── */
    const saveModal = async () => {
        if (!modalClient) return;
        const clientId = modalClient._id;
        try {
            setError("");
            setIsSavingById((prev) => ({ ...prev, [clientId]: true }));
            const payload = {
                id: clientId,
                studentProgress: normalizeStudentProgress(modalClient.studentProgress),
                notes: modalClient.notes || "",
                universityApplications: (modalClient.universityApplications || []).map((item) => ({
                    universityName:    item.universityName    || "",
                    appliedDate:       item.appliedDate       || null,
                    universityPIN:     item.universityPIN     || "",
                    studentNumber:     item.studentNumber     || "",
                    universityPassword:item.universityPassword|| "",
                    applicationEmail:  item.applicationEmail  || "",
                    progressStatus:    item.progressStatus    || "Not Started",
                    applicationStatus: item.applicationStatus || "Not Applied",
                    applicationResult: item.applicationResult || "",
                    rejectionReason:   item.rejectionReason   || "",
                    notes:             item.notes             || "",
                })),
            };
            const res = await fetch("/api/application-assistance", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            if (!res.ok) throw new Error("Save failed");
            const updated = await res.json();
            const nu = {
                ...updated,
                studentProgress: normalizeStudentProgress(updated.studentProgress),
            };
            setClients((prev) => prev.map((c) => (c._id === clientId ? nu : c)));
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

    /* ─────────────────────────────────────────────────
       RENDER
    ───────────────────────────────────────────────── */
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

                {/* ── STATS ROW ── */}
                <div className={styles.statsRow}>
                    {[
                        {
                            label: "Total Clients",
                            value: clients.length,
                            color: "#00563b",
                            icon: <FiUser />,
                            suffix: "",
                        },
                        {
                            label: "Total Revenue",
                            value: formatCurrency(totalRevenue, clients[0]?.currency || "R"),
                            color: "#00563b",
                            icon: <FiDollarSign />,
                            isString: true,
                        },
                        {
                            label: "Not Applied",
                            value: notAppliedCount,
                            color: "#b45309",
                            icon: <FiAlertTriangle />,
                            suffix: " unis",
                        },
                        {
                            label: "Accepted",
                            value: acceptedCount,
                            color: "#00563b",
                            icon: <FiAward />,
                            suffix: "",
                        },
                        {
                            label: "Total Unis",
                            value: totalUniTasks,
                            color: "#6366f1",
                            icon: <FiList />,
                            suffix: "",
                        },
                    ].map((s, i) => (
                        <div key={s.label} className={styles.statCard} style={{ animationDelay: `${i * 0.06}s` }}>
                            <div className={styles.statIconWrap} style={{ background: `${s.color}14`, color: s.color }}>
                                {s.icon}
                            </div>
                            <div>
                                <p className={styles.statLabel}>{s.label}</p>
                                <strong className={s.isString ? styles.statValueSmall : styles.statValue}>
                                    {s.isString ? s.value : `${s.value}${s.suffix || ""}`}
                                </strong>
                            </div>
                        </div>
                    ))}
                </div>

                {/* ── URGENT BANNER — unapplied unis ── */}
                {!loading && urgentUnapplied.length > 0 && (
                    <div className={styles.urgentBanner}>
                        <FiAlertTriangle className={styles.urgentBannerIcon} />
                        <div>
                            <p className={styles.urgentBannerTitle}>
                                {notAppliedCount} universit{notAppliedCount === 1 ? "y" : "ies"} still not applied
                            </p>
                            <p className={styles.urgentBannerBody}>
                                These universities haven't been applied to yet. Open each client to update their status.
                            </p>
                            <div className={styles.urgentBannerItems}>
                                {urgentUnapplied.map((item, i) => (
                                    <span key={i} className={styles.urgentBannerItem}>
                                        {item.client} → {item.uni}
                                    </span>
                                ))}
                                {notAppliedCount > 8 && (
                                    <span className={styles.urgentBannerItem}>+{notAppliedCount - 8} more</span>
                                )}
                            </div>
                        </div>
                    </div>
                )}

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
                                    {opt === "Done"        && progressCounts.done}
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
                            const apps        = client.universityApplications || [];
                            const applied     = apps.filter((u) => (u.applicationStatus || "Not Applied") !== "Not Applied").length;
                            const pct         = apps.length > 0 ? Math.round((applied / apps.length) * 100) : 0;
                            const unapplied   = apps.filter((u) => (u.applicationStatus || "Not Applied") === "Not Applied").length;
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
                                            {unapplied > 0 && (
                                                <span className={styles.unappliedWarning}>
                                                    <FiAlertTriangle style={{ fontSize: "0.65rem" }} />
                                                    {unapplied} not applied
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <div className={styles.clientRowMid}>
                                        <ProgressBadge value={client.studentProgress} />
                                        <div className={styles.progressBarWrap}>
                                            <div className={styles.progressBarTrack}>
                                                <div className={styles.progressBarFill} style={{ width: `${pct}%` }} />
                                            </div>
                                            <span className={styles.progressBarLabel}>{applied}/{apps.length} applied</span>
                                        </div>
                                    </div>

                                    <div className={styles.clientRowRight}>
                                        <span className={styles.amountTag}>
                                            {formatCurrency(client.amount, client.currency || "R")}
                                        </span>
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
                MODAL
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

                                {/* Header */}
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
                                    <button className={styles.modalClose} onClick={closeModal}><FiX /></button>
                                </div>

                                {/* Info strip */}
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
                                            {formatCurrency(modalClient.amount, modalClient.currency || "R")}
                                        </span>
                                    </div>
                                    <div className={styles.infoStripDivider} />
                                    <div className={styles.infoStripItem}>
                                        <span className={styles.infoStripLabel}>Universities</span>
                                        <span className={styles.infoStripValue}>
                                            {(modalClient.universityApplications || []).length}
                                        </span>
                                    </div>
                                    <div className={styles.infoStripDivider} />
                                    <div className={styles.infoStripItem}>
                                        <span className={styles.infoStripLabel}>Not Applied</span>
                                        <span className={styles.infoStripValue} style={{ color: "var(--amber)" }}>
                                            {(modalClient.universityApplications || []).filter(
                                                (u) => (u.applicationStatus || "Not Applied") === "Not Applied"
                                            ).length}
                                        </span>
                                    </div>
                                </div>

                                {/* Body */}
                                <div className={styles.modalBody}>

                                    {/* Overall progress */}
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

                                    {/* General notes */}
                                    <div className={styles.modalSection}>
                                        <h3 className={styles.modalSectionTitle}>General Notes</h3>
                                        <textarea
                                            className={styles.notesTextarea}
                                            placeholder="Add any general notes about this client…"
                                            value={modalClient.notes || ""}
                                            onChange={(e) =>
                                                setModalClient((prev) => ({ ...prev, notes: e.target.value }))
                                            }
                                        />
                                    </div>

                                    {/* University applications */}
                                    <div className={styles.modalSection}>
                                        <div className={styles.uniSectionHeader}>
                                            <h3 className={styles.modalSectionTitle}>University Applications</h3>
                                            <span className={styles.uniCount}>
                                                {(modalClient.universityApplications || []).length} universities
                                            </span>
                                        </div>

                                        <div className={styles.uniGrid}>
                                            {(modalClient.universityApplications || []).map((item, index) => {
                                                const isNotApplied = (item.applicationStatus || "Not Applied") === "Not Applied";
                                                return (
                                                    <div
                                                        key={`${item.universityName}-${index}`}
                                                        className={`${styles.uniCard} ${isNotApplied ? styles.uniCardNotApplied : ""}`}
                                                    >
                                                        {/* Card top */}
                                                        <div className={styles.uniCardTop}>
                                                            <div className={styles.uniCardTopLeft}>
                                                                <div className={styles.uniIndexBadge}>
                                                                    {String(index + 1).padStart(2, "0")}
                                                                </div>
                                                                <div>
                                                                    <h4 className={styles.uniName}>{item.universityName}</h4>
                                                                    <div className={styles.uniPillRow}>
                                                                        <AppStatusPill status={item.applicationStatus || "Not Applied"} />
                                                                        <UniStatusPill status={item.progressStatus} />
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            {/* Application status quick-select */}
                                                            <select
                                                                className={`${styles.uniQuickSelect} ${
                                                                    item.applicationStatus === "Accepted"   ? styles.selectDone :
                                                                    item.applicationStatus === "Applied"    ? styles.selectPending :
                                                                    item.applicationStatus === "Rejected"   ? styles.selectRejected :
                                                                    styles.selectNotApplied
                                                                }`}
                                                                value={item.applicationStatus || "Not Applied"}
                                                                onChange={(e) => updateUniField(index, "applicationStatus", e.target.value)}
                                                            >
                                                                {APPLICATION_STATUS_OPTIONS.map((opt) => (
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
                                                                    Date Applied
                                                                </label>
                                                                <input
                                                                    type="date"
                                                                    className={styles.uniFieldInput}
                                                                    value={toDateInputValue(item.appliedDate)}
                                                                    onChange={(e) => updateUniField(index, "appliedDate", e.target.value || null)}
                                                                />
                                                            </div>

                                                            {/* Student number */}
                                                            <div className={styles.uniFieldGroup}>
                                                                <label className={styles.uniFieldLabel}>
                                                                    <FiHash className={styles.uniFieldIcon} />
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

                                                            {/* PIN */}
                                                            <div className={styles.uniFieldGroup}>
                                                                <label className={styles.uniFieldLabel}>
                                                                    <FiLock className={styles.uniFieldIcon} />
                                                                    PIN / Code
                                                                </label>
                                                                <input
                                                                    type="text"
                                                                    className={styles.uniFieldInput}
                                                                    placeholder="e.g. 12345"
                                                                    value={item.universityPIN || ""}
                                                                    onChange={(e) => updateUniField(index, "universityPIN", e.target.value)}
                                                                />
                                                            </div>

                                                            {/* Application email */}
                                                            <div className={styles.uniFieldGroup}>
                                                                <label className={styles.uniFieldLabel}>
                                                                    <FiMail className={styles.uniFieldIcon} />
                                                                    Email Used
                                                                </label>
                                                                <input
                                                                    type="email"
                                                                    className={styles.uniFieldInput}
                                                                    placeholder="email@example.com"
                                                                    value={item.applicationEmail || ""}
                                                                    onChange={(e) => updateUniField(index, "applicationEmail", e.target.value)}
                                                                />
                                                            </div>

                                                            {/* Portal password */}
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

                                                            {/* Progress status (internal workflow) */}
                                                            <div className={styles.uniFieldGroup}>
                                                                <label className={styles.uniFieldLabel}>
                                                                    <FiClock className={styles.uniFieldIcon} />
                                                                    Task Progress
                                                                </label>
                                                                <select
                                                                    className={`${styles.uniFieldInput} ${
                                                                        item.progressStatus === "Done"    ? styles.selectDone :
                                                                        item.progressStatus === "Pending" ? styles.selectPending :
                                                                        styles.selectDefault
                                                                    }`}
                                                                    value={item.progressStatus || "Not Started"}
                                                                    onChange={(e) => updateUniField(index, "progressStatus", e.target.value)}
                                                                >
                                                                    {PROGRESS_OPTIONS.map((opt) => (
                                                                        <option key={opt} value={opt}>{opt}</option>
                                                                    ))}
                                                                </select>
                                                            </div>

                                                            {/* Rejection reason — only when rejected */}
                                                            {item.applicationStatus === "Rejected" && (
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

                                                            {/* Per-university notes */}
                                                            <div className={`${styles.uniFieldGroup} ${styles.uniFieldGroupFull}`}>
                                                                <label className={styles.uniFieldLabel}>
                                                                    <FiFileText className={styles.uniFieldIcon} />
                                                                    Notes
                                                                </label>
                                                                <input
                                                                    type="text"
                                                                    className={styles.uniFieldInput}
                                                                    placeholder="Any notes for this university…"
                                                                    value={item.notes || ""}
                                                                    onChange={(e) => updateUniField(index, "notes", e.target.value)}
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>

                                {/* Footer */}
                                <div className={styles.modalFooter}>
                                    <button className={styles.cancelBtn} onClick={closeModal}>Cancel</button>
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