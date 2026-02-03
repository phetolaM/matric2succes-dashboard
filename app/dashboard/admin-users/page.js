"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import styles from "./admin-users.module.css";
import { FaArrowLeft, FaPlus, FaEdit, FaEye, FaEyeSlash, FaTrash, FaUserShield } from "react-icons/fa";

export default function AdminUsersPage() {
    const router = useRouter();
    const [admins, setAdmins] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [editEmail, setEditEmail] = useState("");
    const [newEmail, setNewEmail] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [newRole, setNewRole] = useState("admin");
    const [showPassword, setShowPassword] = useState({});
    const [formError, setFormError] = useState("");
    const [formLoading, setFormLoading] = useState(false);

    useEffect(() => {
        fetchAdmins();
    }, []);

    const fetchAdmins = async () => {
        try {
            setLoading(true);
            const res = await fetch("/api/admins");
            if (!res.ok) throw new Error("Failed to fetch admins");
            const data = await res.json();
            setAdmins(data);
            setError("");
        } catch (err) {
            setError("Failed to load admin users");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleAddAdmin = async (e) => {
        e.preventDefault();
        setFormError("");

        if (!newEmail || !newPassword) {
            setFormError("Email and password required");
            return;
        }

        try {
            setFormLoading(true);
            const res = await fetch("/api/admins/create", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: newEmail,
                    password: newPassword,
                    role: newRole,
                }),
            });

            if (!res.ok) {
                const data = await res.json();
                setFormError(data.error || "Failed to create admin");
                return;
            }

            await fetchAdmins();
            setShowForm(false);
            setNewEmail("");
            setNewPassword("");
            setNewRole("admin");
        } catch (err) {
            setFormError("Error creating admin");
            console.error(err);
        } finally {
            setFormLoading(false);
        }
    };

    const handleEditEmail = async (adminId) => {
        if (!editEmail.trim()) {
            setFormError("Email cannot be empty");
            return;
        }

        try {
            setFormLoading(true);
            const res = await fetch(`/api/admins/${adminId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: editEmail }),
            });

            if (!res.ok) {
                const data = await res.json();
                setFormError(data.error || "Failed to update email");
                return;
            }

            await fetchAdmins();
            setEditingId(null);
            setEditEmail("");
        } catch (err) {
            setFormError("Error updating email");
            console.error(err);
        } finally {
            setFormLoading(false);
        }
    };

    const togglePasswordView = (adminId) => {
        setShowPassword((prev) => ({
            ...prev,
            [adminId]: !prev[adminId],
        }));
    };

    const getRoleBadgeClass = (role) => {
        switch (role?.toLowerCase()) {
            case "superadmin":
                return styles.roleSuperAdmin;
            case "moderator":
                return styles.roleModerator;
            default:
                return styles.roleAdmin;
        }
    };

    return (
        <div className={styles.container}>
            {/* Header */}
            <header className={styles.header}>
                <div className={styles.headerContent}>
                    <button
                        className={styles.backButton}
                        onClick={() => router.back()}
                        aria-label="Go back"
                    >
                        <FaArrowLeft />
                        <span>Back</span>
                    </button>
                    <div className={styles.headerTitle}>
                        <FaUserShield className={styles.headerIcon} />
                        <div>
                            <h1>Admin Users Management</h1>
                            <p>Manage administrator accounts and permissions</p>
                        </div>
                    </div>
                </div>
            </header>

            {/* Error Banner */}
            {error && (
                <div className={styles.errorBanner}>
                    <span>{error}</span>
                </div>
            )}

            <main className={styles.main}>
                {/* Action Bar */}
                <div className={styles.actionBar}>
                    <div className={styles.statsCards}>
                        <div className={styles.statCard}>
                            <span className={styles.statLabel}>Total Admins</span>
                            <span className={styles.statValue}>{admins.length}</span>
                        </div>
                    </div>
                    <button
                        className={`${styles.addButton} ${showForm ? styles.addButtonActive : ''}`}
                        onClick={() => {
                            setShowForm(!showForm);
                            setFormError("");
                        }}
                    >
                        <FaPlus />
                        <span>{showForm ? "Cancel" : "Add New Admin"}</span>
                    </button>
                </div>

                {/* Add New Admin Form */}
                {showForm && (
                    <div className={styles.formCard}>
                        <form className={styles.addForm} onSubmit={handleAddAdmin}>
                            <h2 className={styles.formTitle}>Create New Admin</h2>
                            
                            {formError && (
                                <div className={styles.formError}>{formError}</div>
                            )}

                            <div className={styles.formRow}>
                                <div className={styles.formGroup}>
                                    <label>Email Address</label>
                                    <input
                                        type="email"
                                        placeholder="admin@matric2success.com"
                                        value={newEmail}
                                        onChange={(e) => setNewEmail(e.target.value)}
                                        required
                                    />
                                </div>

                                <div className={styles.formGroup}>
                                    <label>Password</label>
                                    <input
                                        type="password"
                                        placeholder="Minimum 6 characters"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>

                            <div className={styles.formGroup}>
                                <label>Role</label>
                                <select
                                    value={newRole}
                                    onChange={(e) => setNewRole(e.target.value)}
                                    className={styles.select}
                                >
                                    <option value="admin">Admin</option>
                                    <option value="superadmin">Super Admin</option>
                                    <option value="moderator">Moderator</option>
                                </select>
                            </div>

                            <button
                                type="submit"
                                className={styles.submitButton}
                                disabled={formLoading}
                            >
                                {formLoading ? "Creating..." : "Create Admin"}
                            </button>
                        </form>
                    </div>
                )}

                {/* Admins Table */}
                {loading ? (
                    <div className={styles.loadingContainer}>
                        <div className={styles.spinner}></div>
                        <p>Loading admin users...</p>
                    </div>
                ) : admins.length === 0 ? (
                    <div className={styles.emptyState}>
                        <FaUserShield className={styles.emptyIcon} />
                        <h3>No Admin Users Found</h3>
                        <p>Click "Add New Admin" to create your first administrator account</p>
                    </div>
                ) : (
                    <div className={styles.tableCard}>
                        <div className={styles.tableWrapper}>
                            <table className={styles.table}>
                                <thead>
                                    <tr>
                                        <th>Email</th>
                                        <th>Role</th>
                                        <th>Password (Hashed)</th>
                                        <th>Created At</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {admins.map((admin) => (
                                        <tr key={admin._id}>
                                            <td>
                                                {editingId === admin._id ? (
                                                    <div className={styles.editInput}>
                                                        <input
                                                            type="email"
                                                            value={editEmail}
                                                            onChange={(e) =>
                                                                setEditEmail(e.target.value)
                                                            }
                                                            autoFocus
                                                        />
                                                        <button
                                                            className={styles.saveButton}
                                                            onClick={() =>
                                                                handleEditEmail(admin._id)
                                                            }
                                                            disabled={formLoading}
                                                        >
                                                            {formLoading ? "..." : "Save"}
                                                        </button>
                                                        <button
                                                            className={styles.cancelButton}
                                                            onClick={() => {
                                                                setEditingId(null);
                                                                setFormError("");
                                                            }}
                                                        >
                                                            Cancel
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <span className={styles.emailText}>
                                                        {admin.email}
                                                    </span>
                                                )}
                                            </td>
                                            <td>
                                                <span className={`${styles.roleBadge} ${getRoleBadgeClass(admin.role)}`}>
                                                    {admin.role}
                                                </span>
                                            </td>
                                            <td>
                                                <div className={styles.passwordCell}>
                                                    <span className={styles.hash}>
                                                        {showPassword[admin._id]
                                                            ? admin.password || "N/A"
                                                            : "••••••••••••••••"}
                                                    </span>
                                                    <button
                                                        className={styles.toggleButton}
                                                        onClick={() =>
                                                            togglePasswordView(admin._id)
                                                        }
                                                        title={
                                                            showPassword[admin._id]
                                                                ? "Hide"
                                                                : "Show"
                                                        }
                                                    >
                                                        {showPassword[admin._id] ? (
                                                            <FaEyeSlash />
                                                        ) : (
                                                            <FaEye />
                                                        )}
                                                    </button>
                                                </div>
                                            </td>
                                            <td className={styles.dateText}>
                                                {admin.createdAt
                                                    ? new Date(admin.createdAt).toLocaleDateString('en-US', {
                                                        year: 'numeric',
                                                        month: 'short',
                                                        day: 'numeric'
                                                    })
                                                    : "N/A"}
                                            </td>
                                            <td>
                                                <div className={styles.actionButtons}>
                                                    {editingId !== admin._id && (
                                                        <button
                                                            className={styles.editButton}
                                                            onClick={() => {
                                                                setEditingId(admin._id);
                                                                setEditEmail(admin.email);
                                                                setFormError("");
                                                            }}
                                                            title="Edit email"
                                                        >
                                                            <FaEdit />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}