"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, Suspense } from "react";
import { FiArrowLeft } from "react-icons/fi";
import DynamicCourseForm from "@/app/components/DynamicCourseForm";
import { getUniversitySchema } from "@/lib/university-schemas";
import styles from "../../shared.module.css";

const UNIVERSITY_CODE = "mut";

function EditCourseMUTContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const courseId = searchParams.get("id");

    const schema = getUniversitySchema(UNIVERSITY_CODE);
    const [course, setCourse] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingCourse, setIsLoadingCourse] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        if (courseId) {
            fetchCourse();
        }
    }, [courseId]);

    const fetchCourse = async () => {
        try {
            setIsLoadingCourse(true);
            const res = await fetch(
                `/api/course-collections/${UNIVERSITY_CODE}?courseId=${courseId}`,
            );
            if (!res.ok) throw new Error("Course not found");
            const data = await res.json();
            setCourse(data);
        } catch (err) {
            console.error("Failed to fetch course:", err);
            setError(err?.message || "Failed to load course");
        } finally {
            setIsLoadingCourse(false);
        }
    };

    const handleSubmit = async (formData) => {
        try {
            setIsLoading(true);
            setError("");
            const res = await fetch(
                `/api/course-collections/${UNIVERSITY_CODE}/${courseId}`,
                {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(formData),
                },
            );

            if (!res.ok) throw new Error("Failed to update course");
            router.push(`/admin/course-collection/${UNIVERSITY_CODE}`);
        } catch (err) {
            console.error("Failed:", err);
            setError(err?.message || "Failed to update course");
            setIsLoading(false);
        }
    };

    if (isLoadingCourse) {
        return (
            <div className={styles.container}>
                <p>Loading course...</p>
            </div>
        );
    }

    if (!course) {
        return (
            <div className={styles.container}>
                <p className={styles.error}>{error || "Course not found"}</p>
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
                    <p className={styles.label}>Edit Course</p>
                    <h1 className={styles.title}>{schema.displayName}</h1>
                </div>
            </header>

            <DynamicCourseForm
                schema={schema}
                initialData={course}
                onSubmit={handleSubmit}
                isLoading={isLoading}
                error={error}
            />
        </div>
    );
}

export default function EditCourseMUTPage() {
    return (
        <Suspense
            fallback={
                <div style={{ padding: "2rem", textAlign: "center" }}>
                    Loading...
                </div>
            }
        >
            <EditCourseMUTContent />
        </Suspense>
    );
}
