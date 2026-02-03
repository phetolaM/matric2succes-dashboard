"use client";

import { useEffect, useState } from "react";
import styles from "./page.module.css";

export default function CourseSamplesPage() {
    const [samples, setSamples] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [activeKey, setActiveKey] = useState(null);

    useEffect(() => {
        fetchSamples();
    }, []);

    const fetchSamples = async () => {
        try {
            setLoading(true);
            setError("");
            const res = await fetch("/api/course-samples");
            if (!res.ok) throw new Error("Failed to fetch samples");
            const data = await res.json();
            setSamples(data);
            setActiveKey(Object.keys(data)[0]);
        } catch (err) {
            console.error("Failed:", err);
            setError(err?.message || "Failed to load samples");
        } finally {
            setLoading(false);
        }
    };

    if (loading)
        return (
            <div className={styles.container}>
                <p>Loading...</p>
            </div>
        );
    if (error)
        return (
            <div className={styles.container}>
                <p className={styles.error}>{error}</p>
            </div>
        );
    if (!samples)
        return (
            <div className={styles.container}>
                <p>No data</p>
            </div>
        );

    const entries = Object.entries(samples);

    return (
        <div className={styles.container}>
            <h1>Course Samples by University</h1>
            <div className={styles.layout}>
                <div className={styles.sidebar}>
                    {entries.map(([key]) => (
                        <button
                            key={key}
                            className={`${styles.tab} ${
                                activeKey === key ? styles.activeTab : ""
                            }`}
                            onClick={() => setActiveKey(key)}
                        >
                            {key.toUpperCase()}
                        </button>
                    ))}
                </div>
                <div className={styles.content}>
                    {activeKey && samples[activeKey] ? (
                        <div>
                            <h2>{activeKey.toUpperCase()}</h2>
                            <pre className={styles.json}>
                                {JSON.stringify(samples[activeKey], null, 2)}
                            </pre>
                        </div>
                    ) : (
                        <p>No course found for this university</p>
                    )}
                </div>
            </div>
        </div>
    );
}
