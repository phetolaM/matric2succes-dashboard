"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./user-list-details.module.css";
import {
    FiArrowLeft,
    FiUser,
    FiUsers,
    FiMail,
    FiCalendar,
    FiChevronUp,
    FiChevronDown,
    FiTrash2,
    FiX,
    FiCheck,
    FiRefreshCw,
    FiClock,
    FiFilter,
    FiMapPin,
    FiSearch,
    FiGlobe,
} from "react-icons/fi";

export default function UserListDetails() {
    const router = useRouter();
    const [users, setUsers] = useState([]);
    const [filteredUsers, setFilteredUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [locationSearch, setLocationSearch] = useState("");
    const [searchDate, setSearchDate] = useState("");
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [userToDelete, setUserToDelete] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [sendingIds, setSendingIds] = useState([]);
    const [sortDirection, setSortDirection] = useState("desc");
    const [showDateFilter, setShowDateFilter] = useState(false);

    // tick to trigger countdown updates for scheduled emails
    const [tick, setTick] = useState(0);
    useEffect(() => {
        const id = setInterval(() => setTick((t) => t + 1), 1000);
        return () => clearInterval(id);
    }, []);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            setIsRefreshing(true);
            setError(null);
            const res = await fetch("/api/user-list");
            if (!res.ok) throw new Error("Failed to fetch users");
            const data = await res.json();
            setUsers(data);
            setFilteredUsers(data);
        } catch (err) {
            console.error("Failed to fetch users:", err);
            setError("Failed to load users. Please try again.");
        } finally {
            setLoading(false);
            setIsRefreshing(false);
        }
    };

    // Auto-process due scheduled emails every 30 seconds
    useEffect(() => {
        const processDueEmails = async () => {
            try {
                const hasDue = users.some(
                    (u) =>
                        u.scheduled &&
                        !u.emailSent &&
                        u.scheduledAt &&
                        new Date(u.scheduledAt) <= new Date()
                );
                if (hasDue) {
                    const res = await fetch("/api/scheduled-emails/process", {
                        method: "POST",
                    });
                    if (res.ok) {
                        const data = await res.json();
                        if (data.succeeded > 0) {
                            console.log("Auto-processed scheduled emails:", data);
                            await fetchUsers(); // Refresh to show updated status
                        }
                    }
                }
            } catch (err) {
                console.error("Auto-process scheduled emails error:", err);
            }
        };

        // Check every 30 seconds for due emails
        const interval = setInterval(processDueEmails, 30000);
        // Also check immediately if there are due emails on mount
        processDueEmails();

        return () => clearInterval(interval);
    }, [users]);

    // Filter by search terms and date
    useEffect(() => {
        let result = users;

        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            result = result.filter((user) =>
                user.name?.toLowerCase().includes(term) ||
                user.email?.toLowerCase().includes(term)
            );
        }

        if (locationSearch) {
            const locationTerm = locationSearch.toLowerCase();
            result = result.filter((user) =>
                user.province?.toLowerCase().includes(locationTerm) ||
                user.country?.toLowerCase().includes(locationTerm) ||
                user.city?.toLowerCase().includes(locationTerm) ||
                (user.locationData && JSON.stringify(user.locationData).toLowerCase().includes(locationTerm))
            );
        }

        if (searchDate) {
            result = result.filter((user) =>
                user.visits?.some((visit) => {
                    if (typeof visit === 'object' && visit.date) {
                        return new Date(visit.date).toLocaleDateString() ===
                            new Date(searchDate).toLocaleDateString();
                    }
                    return false;
                }),
            );
        }

        setFilteredUsers(result);
    }, [searchTerm, locationSearch, searchDate, users]);

    // Sort by most recent visit
    const sortedUsers = [...filteredUsers].sort((a, b) => {
        const modifier = sortDirection === "asc" ? 1 : -1;
        
        const getLatestVisitDate = (user) => {
            if (!user.visits || user.visits.length === 0) return new Date(0);
            
            // Handle both object and string formats
            const latestVisit = user.visits[0]; // Assuming visits are already sorted newest first
            const date = latestVisit.date || latestVisit;
            return new Date(date);
        };
        
        const aDate = getLatestVisitDate(a);
        const bDate = getLatestVisitDate(b);
        
        return (aDate - bDate) * modifier;
    });

    const handleSortDate = () => {
        setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    };

    const confirmDelete = (user) => setUserToDelete(user);
    const cancelDelete = () => setUserToDelete(null);

    const deleteUser = async () => {
        if (!userToDelete) return;
        try {
            setIsDeleting(true);
            const res = await fetch(`/api/user-list/${userToDelete._id}`, {
                method: "DELETE",
            });
            if (!res.ok) throw new Error("Failed to delete user");
            setUsers(users.filter((u) => u._id !== userToDelete._id));
            setUserToDelete(null);
        } catch (err) {
            console.error("Failed to delete user:", err);
            setError("Failed to delete user. Please try again.");
        } finally {
            setIsDeleting(false);
        }
    };

    const sendNow = async (user) => {
        try {
            setSendingIds((s) => [...s, user._id]);
            const res = await fetch(`/api/user-list/send-now/${user._id}`, {
                method: "POST",
            });
            if (!res.ok) throw new Error("Failed to send now");
            await fetchUsers();
        } catch (err) {
            console.error("Failed to send now:", err);
            setError("Failed to send email. See server logs.");
        } finally {
            setSendingIds((s) => s.filter((id) => id !== user._id));
        }
    };

    const emailsSent = users.filter((u) => u.emailSent).length;
    const emailsScheduled = users.filter(
        (u) => u.scheduled && !u.emailSent,
    ).length;
    const emailsNotSent = users.filter(
        (u) => !u.emailSent && !u.scheduled,
    ).length;

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
                        <FiArrowLeft />
                        <span>Back</span>
                    </button>
                    <div className={styles.headerTitle}>
                        <FiUsers className={styles.headerIcon} />
                        <div>
                            <h1>APS Calculator Users</h1>
                            <p>
                                View and manage all users who calculated their
                                APS
                            </p>
                        </div>
                    </div>
                </div>
            </header>

            <main className={styles.main}>
                {/* Error Banner */}
                {error && (
                    <div className={styles.errorBanner}>
                        <span>{error}</span>
                        <button
                            onClick={fetchUsers}
                            className={styles.retryButton}
                        >
                            <FiRefreshCw /> Retry
                        </button>
                    </div>
                )}

                {/* Stats Cards */}
                <div className={styles.statsGrid}>
                    <div className={styles.statCard}>
                        <div className={styles.statContent}>
                            <span className={styles.statLabel}>
                                Total Users
                            </span>
                            <span className={styles.statValue}>
                                {users.length}
                            </span>
                        </div>
                        <FiUsers className={styles.statIcon} />
                    </div>

                    <div className={styles.statCard}>
                        <div className={styles.statContent}>
                            <span className={styles.statLabel}>
                                Emails Sent
                            </span>
                            <span className={styles.statValue}>
                                {emailsSent}
                            </span>
                        </div>
                        <FiCheck className={styles.statIcon} />
                    </div>

                    <div className={styles.statCard}>
                        <div className={styles.statContent}>
                            <span className={styles.statLabel}>Scheduled</span>
                            <span className={styles.statValue}>
                                {emailsScheduled}
                            </span>
                        </div>
                        <FiClock className={styles.statIcon} />
                    </div>

                    <div className={styles.statCard}>
                        <div className={styles.statContent}>
                            <span className={styles.statLabel}>Not Sent</span>
                            <span className={styles.statValue}>
                                {emailsNotSent}
                            </span>
                        </div>
                        <FiMail className={styles.statIcon} />
                    </div>
                </div>

                {/* Search Bar */}
                <div className={styles.searchSection}>
                    <div className={styles.searchGroup}>
                        <FiSearch className={styles.searchIcon} />
                        <input
                            type="text"
                            placeholder="Search by name or email..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className={styles.searchInput}
                        />
                        {searchTerm && (
                            <button
                                className={styles.clearSearchButton}
                                onClick={() => setSearchTerm("")}
                                title="Clear search"
                            >
                                <FiX />
                            </button>
                        )}
                    </div>
                    
                    <div className={styles.searchGroup}>
                        <FiMapPin className={styles.searchIcon} />
                        <input
                            type="text"
                            placeholder="Search by location (city, province, country)..."
                            value={locationSearch}
                            onChange={(e) => setLocationSearch(e.target.value)}
                            className={styles.searchInput}
                        />
                        {locationSearch && (
                            <button
                                className={styles.clearSearchButton}
                                onClick={() => setLocationSearch("")}
                                title="Clear location search"
                            >
                                <FiX />
                            </button>
                        )}
                    </div>
                </div>

                {/* Action Bar */}
                <div className={styles.actionBar}>
                    <button
                        className={styles.refreshButton}
                        onClick={fetchUsers}
                        disabled={isRefreshing}
                    >
                        <FiRefreshCw
                            className={isRefreshing ? styles.spinning : ""}
                        />
                        {isRefreshing ? "Refreshing..." : "Refresh"}
                    </button>

                    <button
                        className={`${styles.filterButton} ${showDateFilter ? styles.filterButtonActive : ""}`}
                        onClick={() => setShowDateFilter(!showDateFilter)}
                    >
                        <FiFilter />
                        Filter by Date
                    </button>
                </div>

                {/* Date Filter */}
                {showDateFilter && (
                    <div className={styles.dateFilterCard}>
                        <label htmlFor="date-filter">Select Visit Date:</label>
                        <input
                            id="date-filter"
                            type="date"
                            value={searchDate}
                            onChange={(e) => setSearchDate(e.target.value)}
                            className={styles.dateInput}
                        />
                        {searchDate && (
                            <button
                                className={styles.clearButton}
                                onClick={() => setSearchDate("")}
                            >
                                <FiX /> Clear
                            </button>
                        )}
                    </div>
                )}

                {/* Users Table */}
                {loading ? (
                    <div className={styles.loadingContainer}>
                        <div className={styles.spinner}></div>
                        <p>Loading users...</p>
                    </div>
                ) : sortedUsers.length === 0 ? (
                    <div className={styles.emptyState}>
                        <FiUser className={styles.emptyIcon} />
                        <h3>No Users Found</h3>
                        <p>
                            {searchTerm || locationSearch || searchDate
                                ? "Try adjusting your search or filters"
                                : "No users have calculated their APS yet"}
                        </p>
                    </div>
                ) : (
                    <div className={styles.tableCard}>
                        <div className={styles.tableWrapper}>
                            <table className={styles.table}>
                                <thead>
                                    <tr>
                                        <th>
                                            <div className={styles.thContent}>
                                                <FiUser />
                                                <span>Name</span>
                                            </div>
                                        </th>
                                        <th>
                                            <div className={styles.thContent}>
                                                <FiMail />
                                                <span>Email</span>
                                            </div>
                                        </th>
                                        <th>
                                            <div className={styles.thContent}>
                                                <FiMapPin />
                                                <span>Location</span>
                                            </div>
                                        </th>
                                        {/* <th>
                                            <div className={styles.thContent}>
                                                <FiClock />
                                                <span>Email Status</span>
                                            </div>
                                        </th> */}
                                        <th>
                                            <div
                                                className={`${styles.thContent} ${styles.sortable}`}
                                                onClick={handleSortDate}
                                            >
                                                <FiCalendar />
                                                <span>Visit History</span>
                                                {sortDirection === "asc" ? (
                                                    <FiChevronUp />
                                                ) : (
                                                    <FiChevronDown />
                                                )}
                                            </div>
                                        </th>
                                        <th>Actions</th>
                                         <th>
                                            <div className={styles.thContent}>
                                                <FiClock />
                                                <span>Email Status</span>
                                            </div>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {sortedUsers.map((user) => (
                                        <tr key={user._id}>
                                            <td>
                                                <div
                                                    className={styles.userCell}
                                                >
                                                    <div
                                                        className={
                                                            styles.userAvatar
                                                        }
                                                    >
                                                        {user.name
                                                            .charAt(0)
                                                            .toUpperCase()}
                                                    </div>
                                                    <span
                                                        className={
                                                            styles.userName
                                                        }
                                                    >
                                                        {user.name}
                                                    </span>
                                                </div>
                                            </td>
                                            <td>
                                                <a
                                                    href={`mailto:${user.email}`}
                                                    className={styles.emailLink}
                                                >
                                                    {user.email}
                                                </a>
                                            </td>
                                            <td>
                                                <div className={styles.locationCell}>
                                                    {user.country && (
                                                        <div className={styles.locationItem}>
                                                            <FiGlobe className={styles.locationIcon} />
                                                            <span className={styles.locationText}>
                                                                {user.country}
                                                                {user.province && `, ${user.province}`}
                                                                {user.city && `, ${user.city}`}
                                                            </span>
                                                        </div>
                                                    )}
                                                    {user.locationData && (
                                                        <div className={styles.locationDetails}>
                                                            <small>
                                                                {user.locationData.region && `${user.locationData.region}, `}
                                                                {user.locationData.city && `${user.locationData.city}, `}
                                                                {user.locationData.country}
                                                            </small>
                                                        </div>
                                                    )}
                                                    {!user.country && !user.locationData && (
                                                        <span className={styles.noLocation}>
                                                            Location not available
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td>
                                                <div className={styles.visitsContainer}>
                                                    {user.visits?.length > 0 ? (
                                                        // Sort visits by date (newest first)
                                                        [...user.visits]
                                                            .sort((a, b) => {
                                                                const dateA = new Date(a.date || a);
                                                                const dateB = new Date(b.date || b);
                                                                return dateB - dateA;
                                                            })
                                                            .map((visit, idx) => {
                                                                const visitDate = visit.date || visit;
                                                                const ipAddress = visit.ip || user.ipAddress;
                                                                
                                                                return (
                                                                    <div key={idx} className={styles.visitItem}>
                                                                        <div className={styles.visitHeader}>
                                                                            {/* {idx === 0 && (
                                                                                <span className={styles.latestBadge}>Latest</span>
                                                                            )} */}
                                                                            <span className={styles.visitDate}>
                                                                                {new Date(visitDate).toLocaleString()}
                                                                            </span>
                                                                        </div>
                                                                        {ipAddress && (
                                                                            <div className={styles.visitIp}>
                                                                                <FiGlobe className={styles.ipIcon} />
                                                                                <span>{ipAddress}</span>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                );
                                                            })
                                                    ) : (
                                                        <span className={styles.noData}>
                                                            No visit data
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td>
                                                {user.emailSent ? (
                                                    <div
                                                        className={`${styles.statusBadge} ${styles.statusSent}`}
                                                    >
                                                        <FiCheck />
                                                        <div
                                                            className={
                                                                styles.statusContent
                                                            }
                                                        >
                                                            <span>Sent</span>
                                                            {user.emailSentAt && (
                                                                <small>
                                                                    {new Date(
                                                                        user.emailSentAt,
                                                                    ).toLocaleString()}
                                                                </small>
                                                            )}
                                                        </div>
                                                    </div>
                                                ) : user.scheduled &&
                                                  user.scheduledAt ? (
                                                    <div
                                                        className={`${styles.statusBadge} ${styles.statusScheduled}`}
                                                    >
                                                        <FiClock />
                                                        <div
                                                            className={
                                                                styles.statusContent
                                                            }
                                                        >
                                                            <span>
                                                                Scheduled
                                                            </span>
                                                            <small>
                                                                {(() => {
                                                                    const ms =
                                                                        new Date(
                                                                            user.scheduledAt,
                                                                        ).getTime() -
                                                                        Date.now();
                                                                    if (ms <= 0)
                                                                        return "Due";
                                                                    const totalSec =
                                                                        Math.floor(
                                                                            ms /
                                                                                1000,
                                                                        );
                                                                    const hrs =
                                                                        Math.floor(
                                                                            totalSec /
                                                                                3600,
                                                                        );
                                                                    const mins =
                                                                        Math.floor(
                                                                            (totalSec %
                                                                                3600) /
                                                                                60,
                                                                        );
                                                                    const secs =
                                                                        totalSec %
                                                                        60;
                                                                    return `${hrs > 0 ? hrs + "h " : ""}${mins}m ${secs}s`;
                                                                })()}
                                                            </small>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div
                                                        className={`${styles.statusBadge} ${styles.statusNotSent}`}
                                                    >
                                                        <span>Not sent</span>
                                                    </div>
                                                )}
                                            </td>
                                            
                                            <td>
                                                <div
                                                    className={
                                                        styles.actionButtons
                                                    }
                                                >
                                                    {!user.emailSent && (
                                                        <button
                                                            className={
                                                                styles.sendButton
                                                            }
                                                            onClick={() =>
                                                                sendNow(user)
                                                            }
                                                            disabled={sendingIds.includes(
                                                                user._id,
                                                            )}
                                                            title="Send email now"
                                                        >
                                                            {sendingIds.includes(
                                                                user._id,
                                                            ) ? (
                                                                <FiRefreshCw
                                                                    className={
                                                                        styles.spinning
                                                                    }
                                                                />
                                                            ) : (
                                                                <FiMail />
                                                            )}
                                                        </button>
                                                    )}
                                                    <button
                                                        className={
                                                            styles.deleteButton
                                                        }
                                                        onClick={() =>
                                                            confirmDelete(user)
                                                        }
                                                        disabled={isDeleting}
                                                        title="Delete user"
                                                    >
                                                        <FiTrash2 />
                                                    </button>
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

            {/* Delete Confirmation Modal */}
            {userToDelete && (
                <div className={styles.modalOverlay} onClick={cancelDelete}>
                    <div
                        className={styles.modal}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className={styles.modalHeader}>
                            <h3>Confirm Deletion</h3>
                            <button
                                className={styles.modalClose}
                                onClick={cancelDelete}
                            >
                                <FiX />
                            </button>
                        </div>
                        <div className={styles.modalBody}>
                            <p>
                                Are you sure you want to remove{" "}
                                <strong>{userToDelete.name}</strong> (
                                {userToDelete.email}) from the APS users?
                            </p>
                            <p className={styles.modalWarning}>
                                This action cannot be undone.
                            </p>
                        </div>
                        <div className={styles.modalFooter}>
                            <button
                                className={styles.modalCancelButton}
                                onClick={cancelDelete}
                                disabled={isDeleting}
                            >
                                <FiX />
                                Cancel
                            </button>
                            <button
                                className={styles.modalDeleteButton}
                                onClick={deleteUser}
                                disabled={isDeleting}
                            >
                                {isDeleting ? (
                                    <>
                                        <FiRefreshCw
                                            className={styles.spinning}
                                        />
                                        Deleting...
                                    </>
                                ) : (
                                    <>
                                        <FiTrash2 />
                                        Delete User
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}