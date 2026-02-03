"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FiAlertCircle, FiArrowLeft, FiCheckCircle } from "react-icons/fi";
import styles from "../../../admin/aps-visibility/page.module.css";

export default function NormalizeTechnicalMathematicsPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState("");

    const handleNormalize = async () => {
        if (
            !window.confirm(
                "This will merge duplicate subjects named 'Technical mathematics'/'technical mathematics' and update all course references. Continue?",
            )
        ) {
            return;
        }

        try {
            setIsLoading(true);
            setError("");
            setResult(null);

            const res = await fetch(
                "/api/admin/normalize-technical-mathematics",
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                },
            );

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(
                    errorData?.error ||
                        errorData?.message ||
                        `API Error: ${res.status} ${res.statusText}`,
                );
            }

            const data = await res.json();
            setResult(data);
        } catch (err) {
            console.error("Failed:", err);
            setError(err?.message || "Failed to normalize subjects");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <button
                    onClick={() => router.back()}
                    className={styles.backButton}
                    title="Go back"
                >
                    <FiArrowLeft />
                </button>
                <h1>Normalize Technical Mathematics</h1>
            </div>

            <div className={styles.content}>
                <div className={styles.card}>
                    <h2>Fix Duplicate Subject Names</h2>
                    <p>
                        This tool will merge duplicate subjects named
                        <strong> Technical Mathematics</strong> and update all
                        course references.
                    </p>

                    {error && (
                        <div className={styles.error}>
                            <FiAlertCircle />
                            <span>{error}</span>
                        </div>
                    )}

                    {result && (
                        <div className={styles.success}>
                            <FiCheckCircle />
                            <div>
                                <p>{result.message}</p>
                                {result.removedCount !== undefined && (
                                    <p>
                                        Removed duplicates:{" "}
                                        {result.removedCount}
                                    </p>
                                )}
                                {result.courseDocumentsUpdated !==
                                    undefined && (
                                    <p>
                                        Course docs updated:{" "}
                                        {result.courseDocumentsUpdated}
                                    </p>
                                )}
                            </div>
                        </div>
                    )}

                    <button
                        onClick={handleNormalize}
                        disabled={isLoading}
                        className={styles.primaryButton}
                    >
                        {isLoading ? "Normalizing..." : "Normalize Now"}
                    </button>
                </div>
            </div>
        </div>
    );
}
