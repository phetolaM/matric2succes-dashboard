"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
    FiAlertCircle,
    FiArrowLeft,
    FiCheck,
    FiRefreshCw,
    FiSave,
    FiSearch,
    FiX,
} from "react-icons/fi";
import styles from "./page.module.css";

export default function ApsVisibilityPage() {
    const router = useRouter();
    const [entries, setEntries] = useState([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [dirty, setDirty] = useState(false);

    useEffect(() => {
        fetchState();
    }, []);

    const fetchState = async () => {
        try {
            setLoading(true);
            setError("");
            const res = await fetch("/api/aps-visibility", {
                cache: "no-store",
            });
            if (!res.ok) throw new Error("Failed to load visibility state");
            const data = await res.json();
            setEntries(Array.isArray(data) ? data : []);
            setDirty(false);
        } catch (err) {
            console.error("Failed to load APS visibility:", err);
            setError(err?.message || "Could not load APS visibility");
        } finally {
            setLoading(false);
        }
    };

    const filtered = useMemo(() => {
        const term = search.trim().toLowerCase();
        if (!term) return entries;
        return entries.filter(
            (e) =>
                e.displayName?.toLowerCase().includes(term) ||
                e.code?.toLowerCase().includes(term),
        );
    }, [entries, search]);

    const toggle = (code) => {
        setEntries((prev) => {
            const next = prev.map((e) =>
                e.code === code ? { ...e, enabled: !e.enabled } : e,
            );
            return next;
        });
        setDirty(true);
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            setError("");
            
            const updates = entries.map((e) => ({
                code: e.code,
                enabled: e.enabled,
                displayName: e.displayName,
            }));
            
            console.log("Sending updates:", updates.filter(u => !u.enabled));
            
            const res = await fetch("/api/aps-visibility", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ updates }),
            });
            if (!res.ok) throw new Error("Failed to save visibility changes");
            const data = await res.json();
            setEntries(Array.isArray(data) ? data : []);
            setDirty(false);
        } catch (err) {
            console.error("Failed to save APS visibility:", err);
            setError(err?.message || "Could not save changes");
        } finally {
            setSaving(false);
        }
    };

    const renderGrid = () => {
        if (loading) {
            return (
                <div className={styles.grid}>
                    {Array.from({ length: 9 }).map((_, idx) => (
                        <div key={idx} className={styles.cardSkeleton} />
                    ))}
                </div>
            );
        }

        if (filtered.length === 0) {
            return (
                <div className={styles.emptyState}>
                    No universities match your search.
                </div>
            );
        }

        return (
            <div className={styles.grid}>
                {filtered.map((entry) => (
                    <article key={entry.code} className={styles.card}>
                        <div className={styles.cardHeader}>
                            <div className={styles.code}>
                                {entry.code?.toUpperCase()}
                            </div>
                            <button
                                className={
                                    entry.enabled
                                        ? styles.toggleOn
                                        : styles.toggleOff
                                }
                                onClick={() => toggle(entry.code)}
                                type="button"
                                aria-pressed={entry.enabled}
                            >
                                {entry.enabled ? <FiCheck /> : <FiX />}
                                <span>
                                    {entry.enabled ? "Visible" : "Hidden"}
                                </span>
                            </button>
                        </div>
                        <h3 className={styles.title}>{entry.displayName}</h3>
                        <p className={styles.caption}>
                            {entry.enabled
                                ? "Shown to users in APS results"
                                : "Hidden from APS results"}
                        </p>
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
                        onClick={() => router.push("/dashboard")}
                        type="button"
                    >
                        <FiArrowLeft />
                        <span>Back to dashboard</span>
                    </button>

                    <div className={styles.headerCenter}>
                        <p className={styles.label}>APS Visibility</p>
                        <h1 className={styles.heading}>
                            Control shown universities
                        </h1>
                    </div>

                    <div className={styles.headerActions}>
                        <button
                            className={styles.refreshButton}
                            onClick={fetchState}
                            disabled={loading}
                            type="button"
                        >
                            <FiRefreshCw
                                className={loading ? styles.spin : undefined}
                            />
                            Refresh
                        </button>
                        <button
                            className={styles.saveButton}
                            onClick={handleSave}
                            disabled={saving || loading || !dirty}
                            type="button"
                        >
                            <FiSave />
                            {saving ? "Saving..." : "Save"}
                        </button>
                    </div>
                </header>

                {error && (
                    <div className={styles.errorCard}>
                        <FiAlertCircle />
                        <div>
                            <strong>Something went wrong</strong>
                            <p>{error}</p>
                        </div>
                    </div>
                )}

                <div className={styles.searchBar}>
                    <FiSearch className={styles.searchIcon} />
                    <input
                        type="text"
                        placeholder="Search by name or code"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                {renderGrid()}
            </div>
        </div>
    );
}
