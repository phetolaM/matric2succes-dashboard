"use client";

import { useState } from "react";
import { FiArrowLeft, FiCheckCircle, FiAlertCircle } from "react-icons/fi";
import { useRouter } from "next/navigation";
import styles from "../../../page.module.css";

export default function UpdateNMUFacultyPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState("");

    const handleUpdate = async () => {
        if (
            !window.confirm(
                "Are you sure you want to update ALL NMU courses to have faculty 'Business & Economic Sciences'? This action cannot be undone.",
            )
        ) {
            return;
        }

        try {
            setIsLoading(true);
            setError("");
            setResult(null);

            const res = await fetch("/api/admin/update-nmu-faculty", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
            });

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(
                    errorData?.message ||
                        `API Error: ${res.status} ${res.statusText}`,
                );
            }

            const data = await res.json();
            setResult(data);
        } catch (err) {
            console.error("Failed:", err);
            setError(err?.message || "Failed to update NMU faculty");
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
                <h1>Update NMU Faculty</h1>
            </div>

            <div className={styles.content}>
                <div className={styles.card}>
                    <h2>Update All NMU Courses Faculty</h2>
                    <p>
                        This will update all NMU courses to have the faculty:
                        <strong> Business & Economic Sciences</strong>
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
                                <p>
                                    Matched: {result.matchedCount} | Modified:{" "}
                                    {result.modifiedCount}
                                </p>
                            </div>
                        </div>
                    )}

                    <button
                        onClick={handleUpdate}
                        disabled={isLoading}
                        className={styles.primaryButton}
                    >
                        {isLoading ? "Updating..." : "Update All NMU Courses"}
                    </button>
                </div>
            </div>
        </div>
    );
}
