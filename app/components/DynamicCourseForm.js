"use client";

import { useState } from "react";
import { FiX, FiPlus } from "react-icons/fi";
import SubjectRequirementEditor from "./SubjectRequirementEditor";
import styles from "./DynamicCourseForm.module.css";

export default function DynamicCourseForm({
    schema,
    onSubmit,
    isLoading = false,
    initialData = null,
}) {
    const [formData, setFormData] = useState(
        initialData ||
            schema.fields.reduce((acc, field) => {
                if (field.type === "array") acc[field.name] = [];
                else if (field.type === "boolean") acc[field.name] = false;
                else acc[field.name] = "";
                return acc;
            }, {}),
    );

    const [errors, setErrors] = useState({});

    const handleChange = (fieldName, value) => {
        setFormData((prev) => ({ ...prev, [fieldName]: value }));
        if (errors[fieldName]) {
            setErrors((prev) => ({ ...prev, [fieldName]: null }));
        }
    };

    const handleArrayChange = (fieldName, index, value) => {
        setFormData((prev) => ({
            ...prev,
            [fieldName]: prev[fieldName].map((item, i) =>
                i === index ? value : item,
            ),
        }));
    };

    const handleJsonChange = (fieldName, index, jsonString) => {
        try {
            const parsed = JSON.parse(jsonString);
            handleArrayChange(fieldName, index, parsed);
        } catch (e) {
            // Invalid JSON, don't update
        }
    };

    const addArrayItem = (fieldName) => {
        const field = schema.fields.find((f) => f.name === fieldName);
        if (!field) return;

        let newItem = "";
        if (field.itemType === "object") newItem = {};
        else if (field.itemType === "array") newItem = [];

        setFormData((prev) => ({
            ...prev,
            [fieldName]: [...(prev[fieldName] || []), newItem],
        }));
    };

    const removeArrayItem = (fieldName, index) => {
        setFormData((prev) => ({
            ...prev,
            [fieldName]: prev[fieldName].filter((_, i) => i !== index),
        }));
    };

    const validate = () => {
        const newErrors = {};
        schema.fields.forEach((field) => {
            if (field.required && !formData[field.name]) {
                newErrors[field.name] = "This field is required";
            }
        });
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (validate()) {
            onSubmit(formData);
        }
    };

    return (
        <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.fieldsGrid}>
                {schema.fields.map((field) => (
                    <div key={field.name} className={styles.fieldGroup}>
                        <label className={styles.label}>
                            {field.name}
                            {field.required && (
                                <span className={styles.required}>*</span>
                            )}
                        </label>

                        {field.type === "text" && (
                            <input
                                type="text"
                                value={formData[field.name] || ""}
                                onChange={(e) =>
                                    handleChange(field.name, e.target.value)
                                }
                                className={`${styles.input} ${
                                    errors[field.name] ? styles.inputError : ""
                                }`}
                                disabled={isLoading}
                            />
                        )}

                        {field.type === "number" && (
                            <input
                                type="number"
                                value={formData[field.name] || ""}
                                onChange={(e) =>
                                    handleChange(
                                        field.name,
                                        e.target.value
                                            ? Number(e.target.value)
                                            : "",
                                    )
                                }
                                className={styles.input}
                                disabled={isLoading}
                            />
                        )}

                        {field.type === "boolean" && (
                            <label className={styles.checkboxLabel}>
                                <input
                                    type="checkbox"
                                    checked={formData[field.name] || false}
                                    onChange={(e) =>
                                        handleChange(
                                            field.name,
                                            e.target.checked,
                                        )
                                    }
                                    disabled={isLoading}
                                />
                                <span>Enabled</span>
                            </label>
                        )}

                        {field.type === "select" && (
                            <select
                                value={formData[field.name] || ""}
                                onChange={(e) =>
                                    handleChange(field.name, e.target.value)
                                }
                                className={styles.input}
                                disabled={isLoading}
                            >
                                <option value="">Select...</option>
                                {field.options?.map((opt) => (
                                    <option key={opt} value={opt}>
                                        {opt}
                                    </option>
                                ))}
                            </select>
                        )}

                        {field.type === "array" &&
                            (field.name === "subjectRequirementGroups" ||
                                field.name === "subjectRequirements") && (
                                <SubjectRequirementEditor
                                    value={formData[field.name] || []}
                                    onChange={(val) =>
                                        handleChange(field.name, val)
                                    }
                                    disabled={isLoading}
                                />
                            )}

                        {field.type === "array" &&
                            field.name !== "subjectRequirementGroups" &&
                            field.name !== "subjectRequirements" && (
                                <div className={styles.arrayField}>
                                    {Array.isArray(formData[field.name]) &&
                                        formData[field.name].map(
                                            (item, idx) => (
                                                <div
                                                    key={idx}
                                                    className={styles.arrayItem}
                                                >
                                                    {field.itemType ===
                                                        "text" && (
                                                        <input
                                                            type="text"
                                                            value={item}
                                                            onChange={(e) =>
                                                                handleArrayChange(
                                                                    field.name,
                                                                    idx,
                                                                    e.target
                                                                        .value,
                                                                )
                                                            }
                                                            className={
                                                                styles.input
                                                            }
                                                            disabled={isLoading}
                                                        />
                                                    )}
                                                    {field.itemType ===
                                                        "object" && (
                                                        <textarea
                                                            value={JSON.stringify(
                                                                item,
                                                                null,
                                                                2,
                                                            )}
                                                            onChange={(e) =>
                                                                handleJsonChange(
                                                                    field.name,
                                                                    idx,
                                                                    e.target
                                                                        .value,
                                                                )
                                                            }
                                                            className={
                                                                styles.jsonTextarea
                                                            }
                                                            rows={5}
                                                            disabled={isLoading}
                                                            placeholder="Enter valid JSON"
                                                        />
                                                    )}
                                                    {field.itemType ===
                                                        "array" && (
                                                        <textarea
                                                            value={JSON.stringify(
                                                                item,
                                                                null,
                                                                2,
                                                            )}
                                                            onChange={(e) =>
                                                                handleJsonChange(
                                                                    field.name,
                                                                    idx,
                                                                    e.target
                                                                        .value,
                                                                )
                                                            }
                                                            className={
                                                                styles.jsonTextarea
                                                            }
                                                            rows={5}
                                                            disabled={isLoading}
                                                            placeholder="Enter valid JSON array"
                                                        />
                                                    )}
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            removeArrayItem(
                                                                field.name,
                                                                idx,
                                                            )
                                                        }
                                                        className={
                                                            styles.removeBtn
                                                        }
                                                        disabled={isLoading}
                                                    >
                                                        <FiX />
                                                    </button>
                                                </div>
                                            ),
                                        )}
                                    <button
                                        type="button"
                                        onClick={() => addArrayItem(field.name)}
                                        className={styles.addBtn}
                                        disabled={isLoading}
                                    >
                                        <FiPlus /> Add {field.name}
                                    </button>
                                </div>
                            )}

                        {errors[field.name] && (
                            <p className={styles.error}>{errors[field.name]}</p>
                        )}
                    </div>
                ))}
            </div>

            <div className={styles.actions}>
                <button
                    type="submit"
                    disabled={isLoading}
                    className={styles.submitBtn}
                >
                    {isLoading ? "Saving..." : "Save Course"}
                </button>
            </div>
        </form>
    );
}
