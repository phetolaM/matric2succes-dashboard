"use client";

import { useState, useEffect } from "react";
import { FiX, FiPlus } from "react-icons/fi";
import styles from "./SubjectRequirementEditor.module.css";

export default function SubjectRequirementEditor({
    value = [],
    onChange,
    disabled = false,
}) {
    const [subjects, setSubjects] = useState([]);
    const [isLoadingSubjects, setIsLoadingSubjects] = useState(true);

    useEffect(() => {
        fetchSubjects();
    }, []);

    const fetchSubjects = async () => {
        try {
            setIsLoadingSubjects(true);
            const res = await fetch("/api/subjects");
            if (!res.ok) throw new Error("Failed to fetch subjects");
            const data = await res.json();
            setSubjects(data || []);
        } catch (err) {
            console.error("Failed to fetch subjects:", err);
        } finally {
            setIsLoadingSubjects(false);
        }
    };

    const addRequirement = () => {
        onChange([...value, { subjectId: "", percentage: 50 }]);
    };

    const removeRequirement = (index) => {
        onChange(value.filter((_, i) => i !== index));
    };

    const updateRequirement = (index, field, val) => {
        const updated = value.map((item, i) => {
            if (i === index) {
                return { ...item, [field]: val };
            }
            return item;
        });
        onChange(updated);
    };

    const getSubjectName = (subjectId) => {
        const subject = subjects.find((s) => s._id === subjectId);
        return subject?.name || subjectId;
    };

    if (isLoadingSubjects) {
        return <div className={styles.loading}>Loading subjects...</div>;
    }

    return (
        <div className={styles.container}>
            {Array.isArray(value) && value.length > 0 ? (
                <div className={styles.requirements}>
                    {value.map((req, idx) => (
                        <div key={idx} className={styles.requirement}>
                            <div className={styles.field}>
                                <label className={styles.label}>Subject</label>
                                <select
                                    value={req.subjectId || ""}
                                    onChange={(e) =>
                                        updateRequirement(
                                            idx,
                                            "subjectId",
                                            e.target.value,
                                        )
                                    }
                                    className={styles.select}
                                    disabled={disabled}
                                >
                                    <option value="">Select subject...</option>
                                    {subjects.map((subject) => (
                                        <option
                                            key={subject._id}
                                            value={subject._id}
                                        >
                                            {subject.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className={styles.field}>
                                <label className={styles.label}>
                                    Minimum % Required
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={req.percentage || ""}
                                    onChange={(e) =>
                                        updateRequirement(
                                            idx,
                                            "percentage",
                                            Number(e.target.value),
                                        )
                                    }
                                    className={styles.input}
                                    disabled={disabled}
                                />
                            </div>

                            <button
                                type="button"
                                onClick={() => removeRequirement(idx)}
                                className={styles.removeBtn}
                                disabled={disabled}
                                aria-label="Remove requirement"
                            >
                                <FiX />
                            </button>
                        </div>
                    ))}
                </div>
            ) : (
                <div className={styles.empty}>
                    No subject requirements added
                </div>
            )}

            <button
                type="button"
                onClick={addRequirement}
                className={styles.addBtn}
                disabled={disabled}
            >
                <FiPlus /> Add Subject Requirement
            </button>
        </div>
    );
}
