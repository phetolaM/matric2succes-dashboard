"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { FiArrowLeft, FiPlus, FiX } from "react-icons/fi";
import styles from "../../shared.module.css";
import formStyles from "../UNIZULUForm.module.css";

const UNIVERSITY_CODE = "unizulu";

const durationOptions = [
    "6 months",
    "1 year",
    "2 years",
    "3 years",
    "4 years",
    "5 years",
    "6 years",
    "7 years",
    "8 years",
];

const levelOptions = ["Higher Certificate", "Diploma", "Bachelors Degree"];

const facultyOptions = [
    "Humanities and Social Sciences",
    "Education",
    "Commerce, Administration and Law",
    "Science, Agriculture and Engineering",
];

const methodOptions = [
    "Full-time",
    "Part-time",
    "Distance",
    "Online",
    "Hybrid",
];

const emptyGroupItem = () => ({ subjectId: "", percentage: "" });

export default function AddCourseUNIZULUPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [subjects, setSubjects] = useState([]);
    const [languageSubjects, setLanguageSubjects] = useState([]);
    const [noteDraft, setNoteDraft] = useState("");

    const [formData, setFormData] = useState({
        courseName: "",
        courseCode: "",
        faculty: "",
        majoring: "",
        level: "Higher Certificate",
        duration: "",
        methodOfStudy: "Full-time",
        notes: [],
        apsRequirement: "",
        twentyCreditSubjectsRequirement: {
            enabled: false,
            numberOfSubjects: "",
            allowLanguageSubjects: false,
        },
        languageRequirements: [],
        subjectRequirements: [],
        subjectRequirementGroups: [],
    });

    const [errors, setErrors] = useState({});

    // Fetch subjects on mount
    useEffect(() => {
        const fetchSubjects = async () => {
            try {
                const res = await fetch("/api/subjects");
                if (!res.ok) throw new Error("Failed to fetch subjects");
                const data = await res.json();
                const sorted = (data || []).sort((a, b) =>
                    a.name.localeCompare(b.name),
                );
                setSubjects(sorted);
                setLanguageSubjects(
                    sorted.filter((s) => s.isLanguage === true),
                );
            } catch (err) {
                console.error("Failed to fetch subjects:", err);
            }
        };
        fetchSubjects();
    }, []);

    const handleChange = (field, value) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors((prev) => ({ ...prev, [field]: null }));
        }
    };

    // Language Requirements
    const addLanguageRequirement = () => {
        setFormData((prev) => ({
            ...prev,
            languageRequirements: [
                ...prev.languageRequirements,
                {
                    subjectId: "",
                    homeLanguagePercentage: "",
                    additionalLanguagePercentage: "",
                },
            ],
        }));
    };

    const updateLanguageRequirement = (index, key, value) => {
        setFormData((prev) => ({
            ...prev,
            languageRequirements: prev.languageRequirements.map((item, i) =>
                i === index ? { ...item, [key]: value } : item,
            ),
        }));
    };

    const removeLanguageRequirement = (index) => {
        setFormData((prev) => ({
            ...prev,
            languageRequirements: prev.languageRequirements.filter(
                (_, i) => i !== index,
            ),
        }));
    };

    const getAvailableLanguageSubjects = (currentIdx) => {
        const selectedIds = formData.languageRequirements
            .map((req, idx) => (idx !== currentIdx ? req.subjectId : null))
            .filter(Boolean);
        return languageSubjects.filter((s) => !selectedIds.includes(s._id));
    };

    // Subject Requirements
    const addSubjectRequirement = () => {
        setFormData((prev) => ({
            ...prev,
            subjectRequirements: [
                ...prev.subjectRequirements,
                emptyGroupItem(),
            ],
        }));
    };

    const updateSubjectRequirement = (index, key, value) => {
        setFormData((prev) => ({
            ...prev,
            subjectRequirements: prev.subjectRequirements.map((item, i) =>
                i === index ? { ...item, [key]: value } : item,
            ),
        }));
    };

    const removeSubjectRequirement = (index) => {
        setFormData((prev) => ({
            ...prev,
            subjectRequirements: prev.subjectRequirements.filter(
                (_, i) => i !== index,
            ),
        }));
    };

    const getAvailableSubjectsForAND = (currentIdx) => {
        // Get all subjects selected in AND section (except current)
        const selectedInAND = formData.subjectRequirements
            .map((req, idx) => (idx !== currentIdx ? req.subjectId : null))
            .filter(Boolean);

        // Get all subjects selected in any OR group
        const selectedInOR = formData.subjectRequirementGroups
            .flat()
            .map((item) => item.subjectId)
            .filter(Boolean);

        const allSelected = [...selectedInAND, ...selectedInOR];
        return subjects.filter((s) => !allSelected.includes(s._id));
    };

    // Subject Requirement Groups
    const addGroup = () => {
        setFormData((prev) => ({
            ...prev,
            subjectRequirementGroups: [
                ...prev.subjectRequirementGroups,
                [emptyGroupItem()],
            ],
        }));
    };

    const addGroupItem = (groupIdx) => {
        setFormData((prev) => ({
            ...prev,
            subjectRequirementGroups: prev.subjectRequirementGroups.map(
                (group, i) =>
                    i === groupIdx ? [...group, emptyGroupItem()] : group,
            ),
        }));
    };

    const updateGroupItem = (groupIdx, itemIdx, key, value) => {
        setFormData((prev) => ({
            ...prev,
            subjectRequirementGroups: prev.subjectRequirementGroups.map(
                (group, i) =>
                    i === groupIdx
                        ? group.map((item, j) =>
                              j === itemIdx ? { ...item, [key]: value } : item,
                          )
                        : group,
            ),
        }));
    };

    const removeGroupItem = (groupIdx, itemIdx) => {
        setFormData((prev) => ({
            ...prev,
            subjectRequirementGroups: prev.subjectRequirementGroups.map(
                (group, i) =>
                    i === groupIdx
                        ? group.filter((_, j) => j !== itemIdx)
                        : group,
            ),
        }));
    };

    const removeGroup = (groupIdx) => {
        setFormData((prev) => ({
            ...prev,
            subjectRequirementGroups: prev.subjectRequirementGroups.filter(
                (_, i) => i !== groupIdx,
            ),
        }));
    };

    const getAvailableSubjectsForGroup = (groupIdx, itemIdx) => {
        // Get all subjects selected in AND section
        const selectedInAND = formData.subjectRequirements
            .map((req) => req.subjectId)
            .filter(Boolean);

        // Get subjects selected in current group (except current item)
        const selectedInCurrentGroup =
            formData.subjectRequirementGroups[groupIdx]
                ?.map((item, idx) => (idx !== itemIdx ? item.subjectId : null))
                .filter(Boolean) || [];

        const allSelected = [...selectedInAND, ...selectedInCurrentGroup];
        return subjects.filter((s) => !allSelected.includes(s._id));
    };

    const validate = () => {
        const newErrors = {};
        if (!formData.courseName?.trim()) {
            newErrors.courseName = "Course name is required";
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) return;

        try {
            setIsLoading(true);
            setError("");

            const normInt = (v) =>
                v === "" || v === null || v === undefined
                    ? undefined
                    : Number(v);

            const cleanData = {
                courseName: formData.courseName,
                courseCode: formData.courseCode,
                faculty: formData.faculty,
                majoring: formData.majoring,
                level: formData.level.toLowerCase(),
                duration: formData.duration,
                methodOfStudy: formData.methodOfStudy,
                notes: formData.notes.filter((n) => n.trim()),
                apsRequirement: normInt(formData.apsRequirement),
                languageRequirements: formData.languageRequirements
                    .filter(
                        (r) =>
                            r.subjectId &&
                            (r.homeLanguagePercentage ||
                                r.additionalLanguagePercentage),
                    )
                    .map((r) => ({
                        subjectId: r.subjectId,
                        homeLanguagePercentage: normInt(
                            r.homeLanguagePercentage,
                        ),
                        additionalLanguagePercentage: normInt(
                            r.additionalLanguagePercentage,
                        ),
                    })),
                subjectRequirements: formData.subjectRequirements
                    .filter((r) => r.subjectId && r.percentage)
                    .map((r) => ({
                        subjectId: r.subjectId,
                        percentage: Number(r.percentage),
                    })),
                subjectRequirementGroups: formData.subjectRequirementGroups.map(
                    (group) =>
                        group
                            .filter((item) => item.subjectId && item.percentage)
                            .map((item) => ({
                                subjectId: item.subjectId,
                                percentage: Number(item.percentage),
                            })),
                ),
                twentyCreditSubjectsRequirement: formData
                    .twentyCreditSubjectsRequirement.enabled
                    ? {
                          enabled: true,
                          numberOfSubjects: formData
                              .twentyCreditSubjectsRequirement.numberOfSubjects
                              ? Number(
                                    formData.twentyCreditSubjectsRequirement
                                        .numberOfSubjects,
                                )
                              : null,
                          allowLanguageSubjects:
                              formData.twentyCreditSubjectsRequirement
                                  .allowLanguageSubjects,
                      }
                    : {
                          enabled: false,
                          numberOfSubjects: null,
                          allowLanguageSubjects: false,
                      },
            };

            const res = await fetch(
                `/api/course-collections/${UNIVERSITY_CODE}`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(cleanData),
                },
            );

            if (!res.ok) {
                const apiError = await res.json().catch(() => ({}));
                throw new Error(
                    apiError?.message ||
                        `API Error: ${res.status} ${res.statusText}`,
                );
            }
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
                    <h1 className={styles.title}>University of Zululand</h1>
                </div>
            </header>

            {error && (
                <div className={styles.errorCard}>
                    <p>{error}</p>
                </div>
            )}

            <form onSubmit={handleSubmit} className={formStyles.form}>
                <div className={formStyles.section}>
                    <h2 className={formStyles.sectionTitle}>
                        Basic Information
                    </h2>

                    <div className={formStyles.fieldGroup}>
                        <label className={formStyles.label}>
                            Course Name{" "}
                            <span className={formStyles.required}>*</span>
                        </label>
                        <input
                            type="text"
                            value={formData.courseName}
                            onChange={(e) =>
                                handleChange("courseName", e.target.value)
                            }
                            className={`${formStyles.input} ${
                                errors.courseName ? formStyles.inputError : ""
                            }`}
                            disabled={isLoading}
                        />
                        {errors.courseName && (
                            <p className={formStyles.error}>
                                {errors.courseName}
                            </p>
                        )}
                    </div>

                    <div className={formStyles.fieldGroup}>
                        <label className={formStyles.label}>Course Code</label>
                        <input
                            type="text"
                            value={formData.courseCode}
                            onChange={(e) =>
                                handleChange("courseCode", e.target.value)
                            }
                            className={formStyles.input}
                            disabled={isLoading}
                        />
                    </div>

                    <div className={formStyles.fieldGroup}>
                        <label className={formStyles.label}>Faculty</label>
                        <select
                            value={formData.faculty}
                            onChange={(e) =>
                                handleChange("faculty", e.target.value)
                            }
                            className={formStyles.input}
                            disabled={isLoading}
                        >
                            <option value="">-- select faculty --</option>
                            {facultyOptions.map((f) => (
                                <option key={f} value={f}>
                                    {f}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className={formStyles.fieldGroup}>
                        <label className={formStyles.label}>Majoring</label>
                        <input
                            type="text"
                            value={formData.majoring}
                            onChange={(e) =>
                                handleChange("majoring", e.target.value)
                            }
                            className={formStyles.input}
                            disabled={isLoading}
                        />
                    </div>

                    <div className={formStyles.fieldGroup}>
                        <label className={formStyles.label}>
                            Qualification Level
                        </label>
                        <select
                            value={formData.level}
                            onChange={(e) =>
                                handleChange("level", e.target.value)
                            }
                            className={formStyles.input}
                            disabled={isLoading}
                        >
                            {levelOptions.map((opt) => (
                                <option key={opt} value={opt}>
                                    {opt}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className={formStyles.fieldGroup}>
                        <label className={formStyles.label}>Duration</label>
                        <select
                            value={formData.duration}
                            onChange={(e) =>
                                handleChange("duration", e.target.value)
                            }
                            className={formStyles.input}
                            disabled={isLoading}
                        >
                            <option value="">-- select duration --</option>
                            {durationOptions.map((d) => (
                                <option key={d} value={d}>
                                    {d}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className={formStyles.fieldGroup}>
                        <label className={formStyles.label}>
                            Method of Study
                        </label>
                        <select
                            value={formData.methodOfStudy}
                            onChange={(e) =>
                                handleChange("methodOfStudy", e.target.value)
                            }
                            className={formStyles.input}
                            disabled={isLoading}
                        >
                            {methodOptions.map((m) => (
                                <option key={m} value={m}>
                                    {m}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Notes */}
                <div className={formStyles.section}>
                    <h2 className={formStyles.sectionTitle}>Notes</h2>
                    <div className={formStyles.arrayField}>
                        {formData.notes.map((note, idx) => (
                            <div key={idx} className={formStyles.arrayItem}>
                                <div
                                    className={formStyles.input}
                                    style={{ display: "block" }}
                                >
                                    {note}
                                </div>
                                <button
                                    type="button"
                                    onClick={() =>
                                        setFormData((prev) => ({
                                            ...prev,
                                            notes: prev.notes.filter(
                                                (_, i) => i !== idx,
                                            ),
                                        }))
                                    }
                                    className={formStyles.removeBtn}
                                    disabled={isLoading}
                                >
                                    <FiX />
                                </button>
                            </div>
                        ))}
                        <div className={formStyles.arrayItem}>
                            <input
                                type="text"
                                value={noteDraft}
                                onChange={(e) => setNoteDraft(e.target.value)}
                                className={formStyles.input}
                                disabled={isLoading}
                                placeholder="- Bullet point"
                            />
                            <button
                                type="button"
                                onClick={() => {
                                    const trimmed = noteDraft.trim();
                                    if (!trimmed) return;
                                    setFormData((prev) => ({
                                        ...prev,
                                        notes: [...prev.notes, trimmed],
                                    }));
                                    setNoteDraft("");
                                }}
                                className={formStyles.addBtn}
                                disabled={isLoading || !noteDraft.trim()}
                            >
                                <FiPlus /> Add Note
                            </button>
                        </div>
                    </div>
                </div>

                {/* APS Requirements */}
                <div className={formStyles.section}>
                    <h2 className={formStyles.sectionTitle}>
                        APS Requirements
                    </h2>

                    <div className={formStyles.fieldGroup}>
                        <label className={formStyles.label}>
                            APS Requirement (General)
                        </label>
                        <input
                            type="number"
                            value={formData.apsRequirement}
                            onChange={(e) =>
                                handleChange("apsRequirement", e.target.value)
                            }
                            className={formStyles.input}
                            disabled={isLoading}
                            min="0"
                        />
                    </div>

                    <div className={formStyles.fieldGroup}>
                        <p style={{ fontSize: "0.9em", color: "#666" }}>
                            UNIZULU uses only the general APS requirement.
                        </p>
                    </div>
                </div>

                {/* 20 Credit Subjects Requirement */}
                <div className={formStyles.section}>
                    <h2 className={formStyles.sectionTitle}>
                        20 Credit Subjects Requirement
                    </h2>

                    <div className={formStyles.fieldGroup}>
                        <label className={formStyles.checkboxLabel}>
                            <input
                                type="checkbox"
                                checked={
                                    formData.twentyCreditSubjectsRequirement
                                        .enabled
                                }
                                onChange={(e) =>
                                    setFormData((prev) => ({
                                        ...prev,
                                        twentyCreditSubjectsRequirement: {
                                            ...prev.twentyCreditSubjectsRequirement,
                                            enabled: e.target.checked,
                                            numberOfSubjects: e.target.checked
                                                ? ""
                                                : "",
                                            allowLanguageSubjects: false,
                                        },
                                    }))
                                }
                                disabled={isLoading}
                            />
                            <span>
                                Require students to pass 20-credit subjects
                            </span>
                        </label>
                    </div>

                    {formData.twentyCreditSubjectsRequirement.enabled && (
                        <>
                            <div className={formStyles.fieldGroup}>
                                <label className={formStyles.label}>
                                    Number of Subjects Required{" "}
                                    <span className={formStyles.required}>
                                        *
                                    </span>
                                </label>
                                <select
                                    value={
                                        formData.twentyCreditSubjectsRequirement
                                            .numberOfSubjects
                                    }
                                    onChange={(e) =>
                                        setFormData((prev) => ({
                                            ...prev,
                                            twentyCreditSubjectsRequirement: {
                                                ...prev.twentyCreditSubjectsRequirement,
                                                numberOfSubjects:
                                                    e.target.value,
                                            },
                                        }))
                                    }
                                    className={formStyles.input}
                                    disabled={isLoading}
                                >
                                    <option value="">Select...</option>
                                    <option value="1">1 subject</option>
                                    <option value="2">2 subjects</option>
                                    <option value="3">3 subjects</option>
                                    <option value="4">4 subjects</option>
                                    <option value="5">5 subjects</option>
                                    <option value="6">6 subjects</option>
                                </select>
                                <p
                                    style={{
                                        fontSize: "0.85em",
                                        color: "#666",
                                        marginTop: "0.5rem",
                                    }}
                                >
                                    Select the minimum number of 20-credit
                                    subjects (excluding Life Orientation) that
                                    students must pass.
                                </p>
                            </div>

                            <div className={formStyles.fieldGroup}>
                                <label className={formStyles.checkboxLabel}>
                                    <input
                                        type="checkbox"
                                        checked={
                                            formData
                                                .twentyCreditSubjectsRequirement
                                                .allowLanguageSubjects
                                        }
                                        onChange={(e) =>
                                            setFormData((prev) => ({
                                                ...prev,
                                                twentyCreditSubjectsRequirement:
                                                    {
                                                        ...prev.twentyCreditSubjectsRequirement,
                                                        allowLanguageSubjects:
                                                            e.target.checked,
                                                    },
                                            }))
                                        }
                                        disabled={isLoading}
                                    />
                                    <span>
                                        Allow language subjects to count towards
                                        this requirement
                                    </span>
                                </label>
                                <p
                                    style={{
                                        fontSize: "0.85em",
                                        color: "#666",
                                        marginTop: "0.5rem",
                                    }}
                                >
                                    {formData.twentyCreditSubjectsRequirement
                                        .allowLanguageSubjects
                                        ? `Students must pass at least ${formData.twentyCreditSubjectsRequirement.numberOfSubjects || "X"} subjects, which can include language subjects (excluding Life Orientation).`
                                        : `Students must pass at least ${formData.twentyCreditSubjectsRequirement.numberOfSubjects || "X"} subjects, excluding Life Orientation and language subjects.`}
                                </p>
                            </div>
                        </>
                    )}
                </div>

                {/* Language Requirements */}
                <div className={formStyles.section}>
                    <h2 className={formStyles.sectionTitle}>
                        Language Requirements
                    </h2>
                    <p
                        style={{
                            fontSize: "0.9em",
                            color: "#666",
                            marginBottom: "1rem",
                        }}
                    >
                        Add languages with different percentage requirements for
                        Home Language vs Additional Language
                    </p>
                    <div className={formStyles.arrayField}>
                        {formData.languageRequirements.map((req, idx) => (
                            <div
                                key={idx}
                                style={{
                                    border: "1px solid #d1d5db",
                                    padding: "1rem",
                                    marginBottom: "1rem",
                                    borderRadius: "8px",
                                    backgroundColor: "#f9fafb",
                                }}
                            >
                                <div className={formStyles.fieldGroup}>
                                    <label className={formStyles.label}>
                                        Language
                                    </label>
                                    <select
                                        value={req.subjectId}
                                        onChange={(e) =>
                                            updateLanguageRequirement(
                                                idx,
                                                "subjectId",
                                                e.target.value,
                                            )
                                        }
                                        className={formStyles.input}
                                    >
                                        <option value="">
                                            -- select language --
                                        </option>
                                        {getAvailableLanguageSubjects(idx).map(
                                            (s) => (
                                                <option
                                                    key={s._id}
                                                    value={s._id}
                                                >
                                                    {s.name}
                                                </option>
                                            ),
                                        )}
                                    </select>
                                </div>

                                <div className={formStyles.fieldGroup}>
                                    <label className={formStyles.label}>
                                        Home Language %
                                    </label>
                                    <input
                                        type="number"
                                        placeholder="Optional"
                                        value={req.homeLanguagePercentage}
                                        onChange={(e) =>
                                            updateLanguageRequirement(
                                                idx,
                                                "homeLanguagePercentage",
                                                e.target.value,
                                            )
                                        }
                                        className={formStyles.input}
                                        min="0"
                                        max="100"
                                    />
                                </div>

                                <div className={formStyles.fieldGroup}>
                                    <label className={formStyles.label}>
                                        Additional Language %
                                    </label>
                                    <input
                                        type="number"
                                        placeholder="Optional"
                                        value={req.additionalLanguagePercentage}
                                        onChange={(e) =>
                                            updateLanguageRequirement(
                                                idx,
                                                "additionalLanguagePercentage",
                                                e.target.value,
                                            )
                                        }
                                        className={formStyles.input}
                                        min="0"
                                        max="100"
                                    />
                                </div>

                                <button
                                    type="button"
                                    onClick={() =>
                                        removeLanguageRequirement(idx)
                                    }
                                    className={formStyles.removeBtn}
                                    disabled={isLoading}
                                    style={{ marginTop: "0.5rem" }}
                                >
                                    <FiX /> Remove Language
                                </button>
                            </div>
                        ))}
                        <button
                            type="button"
                            onClick={addLanguageRequirement}
                            className={formStyles.addBtn}
                            disabled={isLoading}
                        >
                            <FiPlus /> Add Language Requirement
                        </button>
                    </div>
                </div>

                {/* Subject Requirements (AND logic) */}
                <div className={formStyles.section}>
                    <h2 className={formStyles.sectionTitle}>
                        Subject Requirements (AND logic)
                    </h2>
                    <p
                        style={{
                            fontSize: "0.9em",
                            color: "#666",
                            marginBottom: "1rem",
                        }}
                    >
                        Student must meet ALL of these requirements
                    </p>
                    <div className={formStyles.arrayField}>
                        {formData.subjectRequirements.map((req, idx) => (
                            <div key={idx} className={formStyles.arrayItem}>
                                <select
                                    value={req.subjectId}
                                    onChange={(e) =>
                                        updateSubjectRequirement(
                                            idx,
                                            "subjectId",
                                            e.target.value,
                                        )
                                    }
                                    className={formStyles.input}
                                >
                                    <option value="">
                                        -- select subject --
                                    </option>
                                    {getAvailableSubjectsForAND(idx).map(
                                        (s) => (
                                            <option key={s._id} value={s._id}>
                                                {s.name}
                                            </option>
                                        ),
                                    )}
                                </select>
                                <input
                                    type="number"
                                    placeholder="%"
                                    value={req.percentage}
                                    onChange={(e) =>
                                        updateSubjectRequirement(
                                            idx,
                                            "percentage",
                                            e.target.value,
                                        )
                                    }
                                    className={formStyles.input}
                                    min="0"
                                    max="100"
                                />
                                <button
                                    type="button"
                                    onClick={() =>
                                        removeSubjectRequirement(idx)
                                    }
                                    className={formStyles.removeBtn}
                                    disabled={isLoading}
                                >
                                    <FiX />
                                </button>
                            </div>
                        ))}
                        <button
                            type="button"
                            onClick={addSubjectRequirement}
                            className={formStyles.addBtn}
                            disabled={isLoading}
                        >
                            <FiPlus /> Add Subject Requirement (AND)
                        </button>
                    </div>
                </div>

                {/* Subject Requirement Groups (OR within groups) */}
                <div className={formStyles.section}>
                    <h2 className={formStyles.sectionTitle}>
                        Subject Requirement Groups (OR logic)
                    </h2>
                    <p
                        style={{
                            fontSize: "0.9em",
                            color: "#666",
                            marginBottom: "1rem",
                        }}
                    >
                        Student must meet ONE option from each group
                    </p>
                    {formData.subjectRequirementGroups.map((group, gIdx) => (
                        <div
                            key={gIdx}
                            style={{
                                border: "2px solid #00563b",
                                padding: "1.5rem",
                                marginBottom: "1.5rem",
                                borderRadius: "8px",
                                backgroundColor: "#f0fdf4",
                            }}
                        >
                            <h4
                                style={{
                                    color: "#00563b",
                                    marginBottom: "1rem",
                                }}
                            >
                                Group #{gIdx + 1}
                            </h4>
                            <div className={formStyles.arrayField}>
                                {group.map((item, iIdx) => (
                                    <div
                                        key={iIdx}
                                        className={formStyles.arrayItem}
                                    >
                                        <select
                                            value={item.subjectId}
                                            onChange={(e) =>
                                                updateGroupItem(
                                                    gIdx,
                                                    iIdx,
                                                    "subjectId",
                                                    e.target.value,
                                                )
                                            }
                                            className={formStyles.input}
                                        >
                                            <option value="">
                                                -- select subject --
                                            </option>
                                            {getAvailableSubjectsForGroup(
                                                gIdx,
                                                iIdx,
                                            ).map((s) => (
                                                <option
                                                    key={s._id}
                                                    value={s._id}
                                                >
                                                    {s.name}
                                                </option>
                                            ))}
                                        </select>
                                        <input
                                            type="number"
                                            placeholder="%"
                                            value={item.percentage}
                                            onChange={(e) =>
                                                updateGroupItem(
                                                    gIdx,
                                                    iIdx,
                                                    "percentage",
                                                    e.target.value,
                                                )
                                            }
                                            className={formStyles.input}
                                            min="0"
                                            max="100"
                                        />
                                        <button
                                            type="button"
                                            onClick={() =>
                                                removeGroupItem(gIdx, iIdx)
                                            }
                                            className={formStyles.removeBtn}
                                            disabled={isLoading}
                                        >
                                            <FiX />
                                        </button>
                                    </div>
                                ))}
                                <button
                                    type="button"
                                    onClick={() => addGroupItem(gIdx)}
                                    className={formStyles.addBtn}
                                    disabled={isLoading}
                                >
                                    <FiPlus /> Add item to group
                                </button>
                            </div>
                            <button
                                type="button"
                                onClick={() => removeGroup(gIdx)}
                                className={formStyles.removeBtn}
                                disabled={isLoading}
                                style={{ marginTop: "1rem" }}
                            >
                                <FiX /> Remove Group
                            </button>
                        </div>
                    ))}
                    <button
                        type="button"
                        onClick={addGroup}
                        className={formStyles.addBtn}
                        disabled={isLoading}
                    >
                        <FiPlus /> Add Group
                    </button>
                </div>

                {/* Submit */}
                <div className={formStyles.actions}>
                    <button
                        type="submit"
                        disabled={isLoading}
                        className={formStyles.submitBtn}
                    >
                        {isLoading ? "Creating..." : "Create Course"}
                    </button>
                </div>
            </form>
        </div>
    );
}
