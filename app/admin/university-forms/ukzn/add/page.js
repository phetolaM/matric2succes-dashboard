"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { FiArrowLeft } from "react-icons/fi";
import DynamicCourseForm from "@/app/components/DynamicCourseForm";
import { getUniversitySchema } from "@/lib/university-schemas";
import styles from "../../shared.module.css";

const UNIVERSITY_CODE = "ukzn";

export default function AddCourseUKZNPage() {
    const router = useRouter();
    const schema = getUniversitySchema(UNIVERSITY_CODE);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (formData) => {
        try {
            setIsLoading(true);
            setError("");
            const res = await fetch(
                `/api/course-collections/${UNIVERSITY_CODE}`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(formData),
                },
            );

            if (!res.ok) throw new Error("Failed to create course");
            router.push(`/admin/course-collection/${UNIVERSITY_CODE}`);
        } catch (err) {
            console.error("Failed:", err);
            setError(err?.message || "Failed to create course");
            setIsLoading(false);
        }
    };

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <button
                    className={styles.backButton}
                    onClick={() => router.back()}
                    type="button"
                >
                    <FiArrowLeft />
                    Back
                </button>
                <div>
                    <p className={styles.label}>Add Course</p>
                    <h1 className={styles.title}>{schema.displayName}</h1>
                </div>
            </header>

            {error && (
                <div className={styles.errorCard}>
                    <p>{error}</p>
                </div>
            )}

            <DynamicCourseForm
                schema={schema}
                onSubmit={handleSubmit}
                isLoading={isLoading}
            />
        </div>
    );
}
