"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "../universities.module.css";
import { FiArrowLeft, FiSave, FiX } from "react-icons/fi";

export default function AddUniversityPage() {
    const [formData, setFormData] = useState({
        title: "",
        subtitle: "",
        image: "",
        officialLink: "",
        prospectus: {
            name: "",
            year: new Date().getFullYear(),
            link: "",
        },
        campusesList: [],
        stats: {
            courses: 0,
            campuses: 0,
        },
        isApplicationOpen: false,
        applicationFee: 0,
    });

    const [loading, setLoading] = useState(false);
    const [uploadingImage, setUploadingImage] = useState(false);
    const [uploadingPDF, setUploadingPDF] = useState(false);
    const [imageError, setImageError] = useState(null);
    const [receivedImageUrl, setReceivedImageUrl] = useState("");
    const [error, setError] = useState(null);
    const router = useRouter();

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        const val =
            type === "checkbox"
                ? checked
                : type === "number"
                  ? Number(value)
                  : value;

        if (name.includes(".")) {
            const [parent, child] = name.split(".");
            setFormData((prev) => ({
                ...prev,
                [parent]: {
                    ...prev[parent],
                    [child]: val,
                },
            }));
        } else {
            setFormData((prev) => ({
                ...prev,
                [name]: val,
            }));
        }
    };

    const addArrayItem = (field) => {
        setFormData((prev) => ({
            ...prev,
            [field]: [...(prev[field] || []), {}],
        }));
    };

    const removeArrayItem = (field, index) => {
        setFormData((prev) => ({
            ...prev,
            [field]: prev[field].filter((_, i) => i !== index),
        }));
    };

    const updateArrayItem = (field, index, itemData) => {
        setFormData((prev) => {
            const arr = [...prev[field]];
            arr[index] = itemData;
            return { ...prev, [field]: arr };
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        console.log(
            "[Add] Form submitted with formData.image:",
            formData.image,
        );

        try {
            const res = await fetch("/api/universities", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.message || "Failed to create university");
            }

            console.log("[Add] University created successfully");
            router.push("/dashboard/universities");
        } catch (err) {
            console.error("Error creating university:", err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleImageUpload = async (file) => {
        if (!file) return;

        // Validate file size (5MB max for images)
        const maxImageSize = 5 * 1024 * 1024; // 5MB
        if (file.size > maxImageSize) {
            setImageError(
                `Image too large. Max size: 5MB. Got: ${(file.size / 1024 / 1024).toFixed(2)}MB`,
            );
            return;
        }

        setUploadingImage(true);
        setImageError(null);
        try {
            const form = new FormData();
            form.append("file", file);

            const res = await fetch("/api/upload/image", {
                method: "POST",
                body: form,
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err?.message || "Upload failed");
            }

            const data = await res.json();
            // Save received URL to formData and display
            console.log("[Add] Image uploaded, URL:", data.url);
            setReceivedImageUrl(data.url);
            setFormData((prev) => {
                const updated = { ...prev, image: data.url };
                console.log("[Add] Updated formData.image:", updated.image);
                return updated;
            });
        } catch (err) {
            console.error("Image upload error:", err);
            setImageError(err.message);
        } finally {
            setUploadingImage(false);
        }
    };

    const handleProspectusPDFUpload = async (file) => {
        if (!file) return;

        // Validate file size (50MB cap enforced client-side for Supabase uploads)
        const maxPDFSize = 50 * 1024 * 1024; // 50MB
        if (file.size > maxPDFSize) {
            alert(
                `PDF too large. Maximum size: 50MB. Your file: ${(file.size / 1024 / 1024).toFixed(2)}MB`,
            );
            return;
        }

        console.log("[Add] Uploading prospectus PDF");
        setUploadingPDF(true);
        try {
            const form = new FormData();
            form.append("file", file);

            const res = await fetch("/api/upload/pdf", {
                method: "POST",
                body: form,
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err?.message || "PDF upload failed");
            }

            const data = await res.json();
            console.log("[Add] Prospectus PDF uploaded, URL:", data.url);

            // Update prospectus object with the link (replaces previous if exists)
            setFormData((prev) => ({
                ...prev,
                prospectus: {
                    ...prev.prospectus,
                    link: data.url,
                },
            }));
        } catch (err) {
            console.error("Prospectus PDF upload error:", err);
            alert(`Failed to upload prospectus PDF: ${err.message}`);
        } finally {
            setUploadingPDF(false);
        }
    };

    return (
        <div className={styles.formContainer}>
            <header className={styles.formHeader}>
                <button
                    className={styles.backButton}
                    onClick={() => router.push("/dashboard/universities")}
                >
                    <FiArrowLeft />
                    Back
                </button>
                <h2>Add New University</h2>
            </header>

            {error && (
                <div className={styles.errorMessage}>
                    {error}
                    <button onClick={() => setError(null)}>
                        <FiX />
                    </button>
                </div>
            )}

            <form onSubmit={handleSubmit} className={styles.form}>
                {/* Basic Info */}
                <section className={styles.formSection}>
                    <h3>Basic Information</h3>

                    <div className={styles.formGroup}>
                        <label>Title *</label>
                        <input
                            type="text"
                            name="title"
                            value={formData.title}
                            onChange={handleInputChange}
                            required
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label>Subtitle *</label>
                        <input
                            type="text"
                            name="subtitle"
                            value={formData.subtitle}
                            onChange={handleInputChange}
                            required
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label>Image</label>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={(e) =>
                                handleImageUpload(e.target.files?.[0])
                            }
                        />
                        <p className={styles.helperText}>
                            Upload an image; it will be saved to Supabase
                            Storage and the URL stored in the database.
                        </p>
                        {uploadingImage && (
                            <p className={styles.helperText}>
                                Uploading image...
                            </p>
                        )}
                        {imageError && (
                            <p className={styles.errorInline}>{imageError}</p>
                        )}
                        {receivedImageUrl && (
                            <div className={styles.imagePreviewWrapper}>
                                <img
                                    src={receivedImageUrl}
                                    alt="University"
                                    className={styles.imagePreview}
                                />
                                <p className={styles.helperTextSmall}>
                                    URL: {receivedImageUrl}
                                </p>
                                <p
                                    className={styles.helperTextSmall}
                                    style={{ fontSize: "0.8em", color: "#666" }}
                                >
                                    Saved in form (will be persisted on submit)
                                </p>
                            </div>
                        )}
                    </div>

                    <div className={styles.formGroup}>
                        <label>Official Link</label>
                        <input
                            type="url"
                            name="officialLink"
                            value={formData.officialLink}
                            onChange={handleInputChange}
                            placeholder="https://example.com"
                        />
                    </div>
                </section>

                {/* Stats */}
                <section className={styles.formSection}>
                    <h3>Statistics</h3>

                    <div className={styles.formGroup}>
                        <label>Number of Courses</label>
                        <input
                            type="number"
                            name="stats.courses"
                            value={formData.stats.courses}
                            onChange={handleInputChange}
                            min="0"
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label>Number of Campuses</label>
                        <input
                            type="number"
                            name="stats.campuses"
                            value={formData.stats.campuses}
                            onChange={handleInputChange}
                            min="0"
                        />
                    </div>
                </section>

                {/* Application Info */}
                <section className={styles.formSection}>
                    <h3>Application Information</h3>

                    <div className={styles.formGroup}>
                        <label>
                            <input
                                type="checkbox"
                                name="isApplicationOpen"
                                checked={formData.isApplicationOpen}
                                onChange={handleInputChange}
                            />
                            Applications are Open
                        </label>
                    </div>

                    <div className={styles.formGroup}>
                        <label>Application Fee</label>
                        <input
                            type="number"
                            name="applicationFee"
                            value={formData.applicationFee}
                            onChange={handleInputChange}
                            min="0"
                        />
                    </div>
                </section>

                {/* Campuses */}
                <section className={styles.formSection}>
                    <div className={styles.sectionHeader}>
                        <h3>Campuses</h3>
                        <button
                            type="button"
                            onClick={() => addArrayItem("campusesList")}
                            className={styles.addItemButton}
                        >
                            + Add Campus
                        </button>
                    </div>

                    {formData.campusesList.map((campus, idx) => (
                        <div key={idx} className={styles.arrayItem}>
                            <div className={styles.formGroup}>
                                <label>Campus Name</label>
                                <input
                                    type="text"
                                    value={campus.name || ""}
                                    onChange={(e) =>
                                        updateArrayItem("campusesList", idx, {
                                            ...campus,
                                            name: e.target.value,
                                        })
                                    }
                                />
                            </div>

                            <div className={styles.formGroup}>
                                <label>Location</label>
                                <input
                                    type="text"
                                    value={campus.location || ""}
                                    onChange={(e) =>
                                        updateArrayItem("campusesList", idx, {
                                            ...campus,
                                            location: e.target.value,
                                        })
                                    }
                                />
                            </div>

                            <button
                                type="button"
                                onClick={() =>
                                    removeArrayItem("campusesList", idx)
                                }
                                className={styles.removeItemButton}
                            >
                                <FiX /> Remove
                            </button>
                        </div>
                    ))}
                </section>

                {/* Prospectus */}
                <section className={styles.formSection}>
                    <h3>Prospectus Document</h3>
                    <p className={styles.helperText}>
                        Upload only one prospectus PDF. Uploading a new one will
                        replace the previous one.
                    </p>

                    <div className={styles.arrayItem}>
                        <div className={styles.formGroup}>
                            <label>Prospectus Name</label>
                            <input
                                type="text"
                                value={formData.prospectus.name || ""}
                                onChange={(e) =>
                                    setFormData((prev) => ({
                                        ...prev,
                                        prospectus: {
                                            ...prev.prospectus,
                                            name: e.target.value,
                                        },
                                    }))
                                }
                                placeholder="e.g., 2025 Prospectus"
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label>Year</label>
                            <input
                                type="number"
                                value={formData.prospectus.year}
                                onChange={(e) =>
                                    setFormData((prev) => ({
                                        ...prev,
                                        prospectus: {
                                            ...prev.prospectus,
                                            year: Number(e.target.value),
                                        },
                                    }))
                                }
                                min="2000"
                                max={new Date().getFullYear()}
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label>PDF File</label>
                            <input
                                type="file"
                                accept="application/pdf"
                                onChange={(e) =>
                                    handleProspectusPDFUpload(
                                        e.target.files?.[0],
                                    )
                                }
                            />
                            {formData.prospectus.link && (
                                <div style={{ marginTop: "8px" }}>
                                    <p className={styles.helperTextSmall}>
                                        ✓ PDF uploaded:{" "}
                                        {formData.prospectus.link.substring(
                                            0,
                                            50,
                                        )}
                                        ...
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </section>

                {/* Form Actions */}
                <div className={styles.formActions}>
                    <button
                        type="button"
                        onClick={() => router.push("/dashboard/universities")}
                        className={styles.cancelButton}
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={loading || uploadingImage || uploadingPDF}
                        className={styles.submitButton}
                    >
                        <FiSave />
                        {loading
                            ? "Creating..."
                            : uploadingImage || uploadingPDF
                              ? "Uploading..."
                              : "Create University"}
                    </button>
                </div>
            </form>
        </div>
    );
}
