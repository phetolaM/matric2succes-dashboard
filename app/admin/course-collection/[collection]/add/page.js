"use client";

import { useRouter, useParams } from "next/navigation";
import { useState, useEffect } from "react";
import { FiArrowLeft } from "react-icons/fi";
import DynamicCourseForm from "@/app/components/DynamicCourseForm";
import { getUniversitySchema } from "@/lib/university-schemas";
import styles from "./page.module.css";

export default function AddCoursePage() {
    const router = useRouter();
    const params = useParams();
    const code = params?.code?.toString()?.toLowerCase() || "";

    const [schema, setSchema] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        const uniSchema = getUniversitySchema(code);
        if (uniSchema) {
            setSchema(uniSchema);
        } else {
            setError(`No schema found for university: ${code}`);
        }
    }, [code]);

    const handleSubmit = async (formData) => {
        try {
            setIsLoading(true);
            setError("");
            const res = await fetch(`/api/course-collections/${code}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            if (!res.ok) throw new Error("Failed to create course");

            router.push(`/admin/course-collection/${code}`);
        } catch (err) {
            console.error("Failed to create course:", err);
            setError(err?.message || "Failed to create course");
            setIsLoading(false);
        }
    };

    if (!schema) {
        return (
            <div className={styles.container}>
                <p className={styles.error}>{error || "Loading..."}</p>
            </div>
        );
    }

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
