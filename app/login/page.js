"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./page.module.css";
import {
    FaEye,
    FaEyeSlash,
    FaLock,
    FaEnvelope,
    FaGraduationCap,
} from "react-icons/fa";

export default function AdminLogin() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const validate = () => {
        if (!email || !password) return "Please enter email and password.";
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email))
            return "Please enter a valid email address.";
        if (password.length < 6)
            return "Password must be at least 6 characters.";
        return "";
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        const validationError = validate();
        if (validationError) {
            setError(validationError);
            return;
        }

        try {
            setLoading(true);
            const res = await fetch("/api/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: email.trim().toLowerCase(),
                    password: password.trim(),
                }),
            });

            if (res.ok) {
                // Successful login - redirect to dashboard
                router.push("/dashboard");
            } else {
                const data = await res
                    .json()
                    .catch(() => ({ error: "Invalid response" }));
                setError(data.error || "Login failed. Please try again.");
            }
        } catch (err) {
            setError("Login failed. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.backgroundShapes}>
                <div className={styles.shape1}></div>
                <div className={styles.shape2}></div>
                <div className={styles.shape3}></div>
            </div>

            <div className={styles.card}>
                <div className={styles.header}>
                    <div className={styles.iconWrapper}>
                        <FaGraduationCap className={styles.logo} />
                    </div>
                    <h1 className={styles.title}>Matric2Succes</h1>
                    <p className={styles.subtitle}>Admin Portal</p>
                </div>

                {error && (
                    <div className={styles.error}>
                        <span>{error}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className={styles.form}>
                    <div className={styles.formGroup}>
                        <label className={styles.label}>Email Address</label>
                        <div className={styles.inputGroup}>
                            <FaEnvelope className={styles.icon} />
                            <input
                                type="email"
                                placeholder="admin@matric2success.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                autoComplete="email"
                                className={styles.input}
                                required
                            />
                        </div>
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.label}>Password</label>
                        <div className={styles.inputGroup}>
                            <FaLock className={styles.icon} />
                            <input
                                type={showPassword ? "text" : "password"}
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                autoComplete="current-password"
                                className={styles.input}
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className={styles.toggle}
                                aria-label={
                                    showPassword
                                        ? "Hide password"
                                        : "Show password"
                                }
                            >
                                {showPassword ? <FaEyeSlash /> : <FaEye />}
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        className={`${styles.button} ${loading ? styles.buttonLoading : ""}`}
                        disabled={loading}
                    >
                        {loading ? (
                            <>
                                <span className={styles.spinner}></span>
                                Signing in...
                            </>
                        ) : (
                            "Sign In"
                        )}
                    </button>

                    <div className={styles.footer}>
                        <a
                            href="#"
                            onClick={(e) => e.preventDefault()}
                            className={styles.link}
                        >
                            Forgot password?
                        </a>
                    </div>
                </form>
            </div>
        </div>
    );
}
