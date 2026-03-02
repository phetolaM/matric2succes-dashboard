"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import styles from "./dashboard.module.css";
import {
    FiLogOut,
    FiBook,
    FiHome,
    FiUsers,
    FiSettings,
    FiBell,
    FiToggleLeft,
    FiClipboard,
} from "react-icons/fi";
import { MdAttachEmail } from "react-icons/md";
import { ImBooks } from "react-icons/im";
import { FaUsersRectangle } from "react-icons/fa6";

export default function AdminDashboard() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState("dashboard");
    const [emailCount, setEmailCount] = useState(0);

    // Fetch email count on component mount
    useEffect(() => {
        const fetchEmailCount = async () => {
            try {
                const res = await fetch("/api/contact/inbox");
                if (res.ok) {
                    const emails = await res.json();
                    setEmailCount(emails.length || 0);
                }
            } catch (error) {
                console.error("Failed to fetch email count:", error);
            }
        };
        fetchEmailCount();
    }, []);

    const handleTabClick = (tab, route) => {
        setActiveTab(tab);
        if (route) {
            router.push(route);
        }
    };

    const handleLogout = async () => {
        try {
            // Call logout API to clear session
            await fetch("/api/logout", {
                method: "POST",
            });

            // Clear local storage
            localStorage.removeItem("adminAuthenticated");

            // Redirect to login
            router.push("/login");
        } catch (error) {
            console.error("Logout failed:", error);
            // Still redirect even if API call fails
            localStorage.removeItem("adminAuthenticated");
            router.push("/login");
        }
    };

    const dashboardCards = [
        {
            id: "admin-users",
            title: "Admin Users",
            description: "Manage all admin accounts",
            icon: FiSettings,
            route: "/dashboard/admin-users",
            colorClass: "adminUsers",
        },
        {
            id: "university-collection",
            title: "Course Collections",
            description: "Manage course collection",
            icon: ImBooks,
            route: "/admin/course-collection",
            colorClass: "courseCollection",
        },
        {
            id: "aps-visibility",
            title: "APS Visibility",
            description: "Toggle universities for APS",
            icon: FiToggleLeft,
            route: "/admin/aps-visibility",
            colorClass: "apsVisibility",
        },
        {
            id: "subjects",
            title: "Manage Subjects",
            description: "Edit course subjects",
            icon: FiBook,
            route: "/dashboard/subjects",
            colorClass: "subjects",
        },
        {
            id: "universities",
            title: "Manage Universities",
            description: "View and edit all institutions",
            icon: FiHome,
            route: "/dashboard/universities",
            colorClass: "universities",
        },
        {
            id: "newsletter",
            title: "Send Newsletter",
            description: "Broadcast news to subscribers",
            icon: FiBell,
            route: "/admin/newsletter",
            colorClass: "newsletter",
        },
        {
            id: "user-list-details",
            title: "User List Details",
            description: "Manage all website users",
            icon: FaUsersRectangle,
            route: "/dashboard/user-list-details",
            colorClass: "userListDetails",
        },
        {
            id: "users",
            title: "Newsletter Subscribers",
            description: "Manage newsletter subscriptions",
            icon: FiUsers,
            route: "/dashboard/user-management",
            colorClass: "userManagement",
        },
        {
            id: "email-inbox",
            title: "Email Inbox",
            description: "View and manage emails",
            icon: MdAttachEmail,
            route: "/dashboard/email-inbox",
            colorClass: "emailInbox",
            badge: emailCount,
        },
        {
            id: "application-assistance",
            title: "Application Assistance",
            description: "Manage paid client applications",
            icon: FiClipboard,
            route: "/dashboard/application-assistance",
            colorClass: "applicationAssistance",
        },
    ];

    return (
        <div className={styles.container}>
            {/* Header */}
            <header className={styles.header}>
                <div className={styles.headerContent}>
                    <div className={styles.headerLeft}>
                        <h1 className={styles.headerTitle}>Matric2Success</h1>
                        <span className={styles.headerSubtitle}>
                            Admin Dashboard
                        </span>
                    </div>
                    <button
                        className={styles.logoutButton}
                        onClick={handleLogout}
                    >
                        <FiLogOut className={styles.logoutIcon} />
                        <span>Logout</span>
                    </button>
                </div>
            </header>

            {/* Main Content */}
            <main className={styles.main}>
                <div className={styles.welcomeSection}>
                    <h2 className={styles.welcomeTitle}>Welcome Back, Admin</h2>
                    <p className={styles.welcomeText}>
                        Manage your platform efficiently from one central
                        location
                    </p>
                </div>

                {/* Dashboard Cards Grid */}
                <div className={styles.cardsGrid}>
                    {dashboardCards.map((card) => {
                        const IconComponent = card.icon;
                        return (
                            <div
                                key={card.id}
                                className={`${styles.card} ${
                                    activeTab === card.id
                                        ? styles.cardActive
                                        : ""
                                }`}
                                onClick={() =>
                                    handleTabClick(card.id, card.route)
                                }
                            >
                                <div
                                    className={`${styles.cardIcon} ${styles[card.colorClass]}`}
                                >
                                    <IconComponent />
                                    {card.badge !== undefined &&
                                        card.badge > 0 && (
                                            <span className={styles.badge}>
                                                {card.badge}
                                            </span>
                                        )}
                                </div>
                                <h3 className={styles.cardTitle}>
                                    {card.title}
                                </h3>
                                <p className={styles.cardDescription}>
                                    {card.description}
                                </p>
                                <div className={styles.cardArrow}>→</div>
                            </div>
                        );
                    })}
                </div>
            </main>
        </div>
    );
}
