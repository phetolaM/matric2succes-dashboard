"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { FiArrowLeft, FiPlus, FiX } from "react-icons/fi";
import styles from "../../shared.module.css";
import formStyles from "../MUTForm.module.css";

const UNIVERSITY_CODE = "mut";

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

const methodOptions = [
    "Full-time",
    "Part-time",
    "Distance",
    "Online",
    "Hybrid",
];

const levelOptions = ["Higher Certificate", "Diploma", "Bachelors Degree"];

const facultyOptions = [
    "Faculty of Natural Sciences",
    "Faculty of Management Sciences",
    "Faculty of Engineering",
    "Faculty of Applied and Health Sciences"
];

const languageOperatorOptions = ["both", "either"];

const emptyGroupItem = () => ({ subjectId: "", percentage: "" });

export default function AddCourseMUTPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [subjects, setSubjects] = useState([]);
    const [languageSubjects, setLanguageSubjects] = useState([]);
    const [careerChoiceDraft, setCareerChoiceDraft] = useState("");

    const [formData, setFormData] = useState({
        courseName: "",
        courseCode: "",
        faculty: "",
        qualificationLevel: "",
        duration: "",
        methodOfStudy: "Full-time",
        apsRequirement: "",
        additionalRequirementsSpecialActive: false,
        additionalRequirementsSpecialCount: 3,
        additionalRequirementsSpecialMinPercentage: "",
        additionalRequirementsSpecialIncludeLO: true,
        subjectRequirements: [],
        subjectRequirementGroups: [],
        subjectCombinationGroups: [],
        languageRequirements: [],
        careerChoices: [],
        additionalRequirements: [],
    });

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
        const selectedInAND = formData.subjectRequirements
            .map((req, idx) => (idx !== currentIdx ? req.subjectId : null))
            .filter(Boolean);

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
        const selectedInAND = formData.subjectRequirements
            .map((req) => req.subjectId)
            .filter(Boolean);

        const selectedInCurrentGroup =
            formData.subjectRequirementGroups[groupIdx]
                ?.map((item, idx) => (idx !== itemIdx ? item.subjectId : null))
                .filter(Boolean) || [];

        const allSelected = [...selectedInAND, ...selectedInCurrentGroup];
        return subjects.filter((s) => !allSelected.includes(s._id));
    };

    // Subject Combination Groups
    const addCombinationGroup = () => {
        setFormData((prev) => ({
            ...prev,
            subjectCombinationGroups: [
                ...prev.subjectCombinationGroups,
                [emptyGroupItem()],
            ],
        }));
    };

    const addCombinationItem = (groupIdx) => {
        setFormData((prev) => ({
            ...prev,
            subjectCombinationGroups: prev.subjectCombinationGroups.map(
                (group, i) =>
                    i === groupIdx ? [...group, emptyGroupItem()] : group,
            ),
        }));
    };

    const updateCombinationItem = (groupIdx, itemIdx, key, value) => {
        setFormData((prev) => ({
            ...prev,
            subjectCombinationGroups: prev.subjectCombinationGroups.map(
                (group, i) =>
                    i === groupIdx
                        ? group.map((item, j) =>
                              j === itemIdx ? { ...item, [key]: value } : item,
                          )
                        : group,
            ),
        }));
    };

    const removeCombinationItem = (groupIdx, itemIdx) => {
        setFormData((prev) => ({
            ...prev,
            subjectCombinationGroups: prev.subjectCombinationGroups.map(
                (group, i) =>
                    i === groupIdx
                        ? group.filter((_, j) => j !== itemIdx)
                        : group,
            ),
        }));
    };

    const removeCombinationGroup = (groupIdx) => {
        setFormData((prev) => ({
            ...prev,
            subjectCombinationGroups: prev.subjectCombinationGroups.filter(
                (_, i) => i !== groupIdx,
            ),
        }));
    };

    const getAvailableSubjectsForCombination = (groupIdx, itemIdx) => {
        const selectedInAND = formData.subjectRequirements
            .map((req) => req.subjectId)
            .filter(Boolean);

        const selectedInCurrentGroup =
            formData.subjectCombinationGroups[groupIdx]
                ?.map((item, idx) => (idx !== itemIdx ? item.subjectId : null))
                .filter(Boolean) || [];

        const allSelected = [...selectedInAND, ...selectedInCurrentGroup];
        return subjects.filter((s) => !allSelected.includes(s._id));
    };

    // Additional Requirements
    const addAdditionalRequirement = () => {
        setFormData((prev) => ({
            ...prev,
            additionalRequirements: [
                ...prev.additionalRequirements,
                { description: "", subjectId: "", percentage: "" },
            ],
        }));
    };

    const updateAdditionalRequirement = (index, key, value) => {
        setFormData((prev) => ({
            ...prev,
            additionalRequirements: prev.additionalRequirements.map(
                (item, i) => (i === index ? { ...item, [key]: value } : item),
            ),
        }));
    };

    const removeAdditionalRequirement = (index) => {
        setFormData((prev) => ({
            ...prev,
            additionalRequirements: prev.additionalRequirements.filter(
                (_, i) => i !== index,
            ),
        }));
    };

    const validate = () => {
        const newErrors = {};
        if (!formData.courseName?.trim()) {
            newErrors.courseName = "Course name is required";
        }
        if (!formData.courseCode?.trim()) {
            newErrors.courseCode = "Course code is required";
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
                apsRequirement: normInt(formData.apsRequirement),
                additionalRequirementsSpecialActive:
                    !!formData.additionalRequirementsSpecialActive,
                additionalRequirementsSpecialCount: normInt(
                    formData.additionalRequirementsSpecialCount,
                ),
                additionalRequirementsSpecialMinPercentage: normInt(
                    formData.additionalRequirementsSpecialMinPercentage,
                ),
                additionalRequirementsSpecialIncludeLO:
                    !!formData.additionalRequirementsSpecialIncludeLO,
                courseName: formData.courseName,
                courseCode: formData.courseCode,
                faculty: formData.faculty,
                qualificationLevel: formData.qualificationLevel,
                duration: formData.duration,
                methodOfStudy: formData.methodOfStudy,
                careerChoices: formData.careerChoices.filter((c) => c.trim()),
                languageRequirementOperator:
                    formData.languageRequirementOperator,
                languageRequirements: formData.languageRequirements
                    .filter((lr) => lr.subjectId)
                    .map((lr) => ({
                        subjectId: lr.subjectId,
                        homeLanguagePercentage: lr.homeLanguagePercentage
                            ? Number(lr.homeLanguagePercentage)
                            : undefined,
                        additionalLanguagePercentage:
                            lr.additionalLanguagePercentage
                                ? Number(lr.additionalLanguagePercentage)
                                : undefined,
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
                subjectCombinationGroups: formData.subjectCombinationGroups.map(
                    (group) =>
                        group
                            .filter((item) => item.subjectId && item.percentage)
                            .map((item) => ({
                                subjectId: item.subjectId,
                                percentage: Number(item.percentage),
                            })),
                ),
                additionalRequirements: formData.additionalRequirements
                    .filter((r) => r.description?.trim() || r.subjectId)
                    .map((r) => ({
                        description: r.description || "",
                        subjectId: r.subjectId || undefined,
                        percentage: normInt(r.percentage),
                    })),
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
                    <h1 className={styles.title}>
                        Mangosuthu University of Technology
                    </h1>
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
                        <label className={formStyles.label}>
                            Course Code{" "}
                            <span className={formStyles.required}>*</span>
                        </label>
                        <input
                            type="text"
                            value={formData.courseCode}
                            onChange={(e) =>
                                handleChange("courseCode", e.target.value)
                            }
                            className={`${formStyles.input} ${
                                errors.courseCode ? formStyles.inputError : ""
                            }`}
                            disabled={isLoading}
                        />
                        {errors.courseCode && (
                            <p className={formStyles.error}>
                                {errors.courseCode}
                            </p>
                        )}
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
                            {facultyOptions.map((faculty) => (
                                <option key={faculty} value={faculty}>
                                    {faculty}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className={formStyles.fieldGroup}>
                        <label className={formStyles.label}>
                            Qualification Level
                        </label>
                        <select
                            value={formData.qualificationLevel}
                            onChange={(e) =>
                                handleChange(
                                    "qualificationLevel",
                                    e.target.value,
                                )
                            }
                            className={formStyles.input}
                            disabled={isLoading}
                        >
                            <option value="">
                                -- select qualification level --
                            </option>
                            {levelOptions.map((level) => (
                                <option key={level} value={level}>
                                    {level}
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
                </div>

                {/* Career Choices */}
                <div className={formStyles.section}>
                    <h2 className={formStyles.sectionTitle}>Career Choices</h2>
                    <div className={formStyles.arrayField}>
                        {formData.careerChoices.map((choice, idx) => (
                            <div key={idx} className={formStyles.arrayItem}>
                                <div
                                    className={formStyles.input}
                                    style={{ display: "block" }}
                                >
                                    {choice}
                                </div>
                                <button
                                    type="button"
                                    onClick={() => removeCareerChoice(idx)}
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
                                value={careerChoiceDraft}
                                onChange={(e) =>
                                    setCareerChoiceDraft(e.target.value)
                                }
                                className={formStyles.input}
                                disabled={isLoading}
                                placeholder="Career option"
                            />
                            <button
                                type="button"
                                onClick={addCareerChoice}
                                className={formStyles.addBtn}
                                disabled={
                                    isLoading || !careerChoiceDraft.trim()
                                }
                            >
                                <FiPlus /> Add
                            </button>
                        </div>
                    </div>
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

                {/* Subject Combination Groups */}
                <div className={formStyles.section}>
                    <h2 className={formStyles.sectionTitle}>
                        Subject Combination Groups
                    </h2>
                    <p
                        style={{
                            fontSize: "0.9em",
                            color: "#666",
                            marginBottom: "1rem",
                        }}
                    >
                        Student must select a valid combination from each group
                    </p>
                    {formData.subjectCombinationGroups.map((group, gIdx) => (
                        <div
                            key={gIdx}
                            style={{
                                border: "2px solid #7c2d12",
                                padding: "1.5rem",
                                marginBottom: "1.5rem",
                                borderRadius: "8px",
                                backgroundColor: "#fef2f2",
                            }}
                        >
                            <h4
                                style={{
                                    color: "#7c2d12",
                                    marginBottom: "1rem",
                                }}
                            >
                                Combination #{gIdx + 1}
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
                                                updateCombinationItem(
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
                                            {getAvailableSubjectsForCombination(
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
                                                updateCombinationItem(
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
                                                removeCombinationItem(
                                                    gIdx,
                                                    iIdx,
                                                )
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
                                    onClick={() => addCombinationItem(gIdx)}
                                    className={formStyles.addBtn}
                                    disabled={isLoading}
                                >
                                    <FiPlus /> Add item to combination
                                </button>
                            </div>
                            <button
                                type="button"
                                onClick={() => removeCombinationGroup(gIdx)}
                                className={formStyles.removeBtn}
                                disabled={isLoading}
                                style={{ marginTop: "1rem" }}
                            >
                                <FiX /> Remove Combination
                            </button>
                        </div>
                    ))}
                    <button
                        type="button"
                        onClick={addCombinationGroup}
                        className={formStyles.addBtn}
                        disabled={isLoading}
                    >
                        <FiPlus /> Add Combination Group
                    </button>
                </div>

                {/* Additional Requirements */}
                <div className={formStyles.section}>
                    <h2 className={formStyles.sectionTitle}>
                        Additional Requirements
                    </h2>
                    <div className={formStyles.arrayField}>
                        <div style={{ marginBottom: "1rem" }}>
                            <div className={formStyles.fieldGroup}>
                                <label className={formStyles.label}>
                                    <input
                                        type="checkbox"
                                        checked={
                                            formData.additionalRequirementsSpecialActive
                                        }
                                        onChange={(e) =>
                                            handleChange(
                                                "additionalRequirementsSpecialActive",
                                                e.target.checked,
                                            )
                                        }
                                    />
                                    &nbsp;Enable "Any N subjects (level 3)"
                                    requirement
                                </label>
                            </div>

                            {formData.additionalRequirementsSpecialActive && (
                                <div
                                    style={{
                                        border: "1px solid #e5e7eb",
                                        padding: "1rem",
                                        borderRadius: "8px",
                                        backgroundColor: "#ffffff",
                                    }}
                                >
                                    <div className={formStyles.fieldGroup}>
                                        <label className={formStyles.label}>
                                            Number of subjects
                                        </label>
                                        <select
                                            value={
                                                formData.additionalRequirementsSpecialCount
                                            }
                                            onChange={(e) =>
                                                handleChange(
                                                    "additionalRequirementsSpecialCount",
                                                    e.target.value,
                                                )
                                            }
                                            className={formStyles.input}
                                            disabled={isLoading}
                                        >
                                            {[1, 2, 3, 4, 5, 6].map((n) => (
                                                <option key={n} value={n}>
                                                    {n}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className={formStyles.fieldGroup}>
                                        <label className={formStyles.label}>
                                            Minimum % for those subjects
                                        </label>
                                        <input
                                            type="number"
                                            value={
                                                formData.additionalRequirementsSpecialMinPercentage
                                            }
                                            onChange={(e) =>
                                                handleChange(
                                                    "additionalRequirementsSpecialMinPercentage",
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
                                            <input
                                                type="checkbox"
                                                checked={
                                                    formData.additionalRequirementsSpecialIncludeLO
                                                }
                                                onChange={(e) =>
                                                    handleChange(
                                                        "additionalRequirementsSpecialIncludeLO",
                                                        e.target.checked,
                                                    )
                                                }
                                            />
                                            &nbsp;Include LO in selection
                                        </label>
                                    </div>
                                </div>
                            )}
                        </div>

                        {formData.additionalRequirements.map((req, idx) => (
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
                                        Description
                                    </label>
                                    <input
                                        type="text"
                                        value={req.description}
                                        onChange={(e) =>
                                            updateAdditionalRequirement(
                                                idx,
                                                "description",
                                                e.target.value,
                                            )
                                        }
                                        className={formStyles.input}
                                        placeholder="Requirement description"
                                    />
                                </div>

                                <div className={formStyles.fieldGroup}>
                                    <label className={formStyles.label}>
                                        Subject (Optional)
                                    </label>
                                    <select
                                        value={req.subjectId}
                                        onChange={(e) =>
                                            updateAdditionalRequirement(
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
                                        {subjects.map((s) => (
                                            <option key={s._id} value={s._id}>
                                                {s.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className={formStyles.fieldGroup}>
                                    <label className={formStyles.label}>
                                        Percentage (Optional)
                                    </label>
                                    <input
                                        type="number"
                                        value={req.percentage}
                                        onChange={(e) =>
                                            updateAdditionalRequirement(
                                                idx,
                                                "percentage",
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
                                        removeAdditionalRequirement(idx)
                                    }
                                    className={formStyles.removeBtn}
                                    disabled={isLoading}
                                    style={{ marginTop: "0.5rem" }}
                                >
                                    <FiX /> Remove Requirement
                                </button>
                            </div>
                        ))}
                        <button
                            type="button"
                            onClick={addAdditionalRequirement}
                            className={formStyles.addBtn}
                            disabled={isLoading}
                        >
                            <FiPlus /> Add Additional Requirement
                        </button>
                    </div>
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
