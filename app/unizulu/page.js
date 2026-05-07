import styles from "../admin/course-collection/page.module.css";

export default async function UNIZULUPage() {
    let courses = [];
    try {
        const res = await fetch("/api/course-collections/unizulu", {
            cache: "no-store",
        });
        if (res.ok) courses = await res.json();
    } catch (err) {
        // swallow - render empty state
        courses = [];
    }

    return (
        <div className={styles.container}>
            <div className={styles.inner}>
                <header className={styles.header}>
                    <div className={styles.titleBlock}>
                        <div className={styles.titleIcon}>U</div>
                        <div>
                            <p className={styles.titleLabel}>unizulu</p>
                            <h1 className={styles.title}>
                                University of Zululand
                            </h1>
                        </div>
                    </div>
                </header>

                <div className={styles.statsBar}>
                    <div className={styles.statItem}>
                        <span className={styles.statLabel}>Total Courses</span>
                        <span className={styles.statValue}>
                            {courses.length}
                        </span>
                    </div>
                </div>

                <div className={styles.grid}>
                    {courses.length === 0 ? (
                        <div className={styles.emptyState}>
                            <p>No courses found for UNIZULU.</p>
                        </div>
                    ) : (
                        courses.map((course) => (
                            <article
                                key={
                                    course._id ||
                                    course.courseCode ||
                                    course.courseName
                                }
                                className={styles.card}
                            >
                                <div className={styles.cardHeader}>
                                    <div className={styles.iconWrap}>🎓</div>
                                    <div style={{ flex: 1 }}>
                                        <h3 className={styles.cardTitle}>
                                            {course.courseName ||
                                                "Untitled course"}
                                        </h3>
                                    </div>
                                </div>

                                <div className={styles.cardFooter}>
                                    <div>
                                        {course.duration && (
                                            <span className={styles.collectionCode}>
                                                Duration: {course.duration}
                                            </span>
                                        )}
                                        {course.methodOfStudy && (
                                            <span className={styles.collectionCode} style={{marginLeft:8}}>
                                                Mode: {course.methodOfStudy}
                                            </span>
                                        )}
                                    </div>
                                    <div>
                                        {course.apsRequirement && (
                                            <span className={styles.collectionCode}>
                                                APS {course.apsRequirement}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {course.faculty && (
                                    <p className={styles.collectionCode} style={{marginTop:6}}>
                                        Faculty: {course.faculty}
                                    </p>
                                )}
                            </article>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
