import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

// starters
const app = express();

// cors setup;

const allowedOrigins = [
    "https://www.matric2succes.co.za",
    "https://matric2succes.co.za",
    "http://localhost:5173", // for local dev
];

app.use(
    cors({
        origin: (origin, callback) => {
            if (!origin || allowedOrigins.includes(origin)) {
                callback(null, true);
            } else {
                callback(new Error("Not allowed by CORS"));
            }
        },
        credentials: true,
        allowedHeaders: ["Authorization", "Content-Type"],
    }),
);

app.use(express.json());

// Database Connection strings
import { connectAdminCredentialsDB } from "./config/adminDB/adminAuthDB.js";
import { connectUniversityDB } from "./config/universityListDB/universityAddDB.js";
import { connectSubjectsDB } from "./config/SubjectConnectionDB/subjectsDB.js";
import { connectNewsletterDB } from "./config/newsletter/newsLetterSubscription.js";
import { connectUniversityCoursesDB } from "./config/coursesDB/coursesDb.js"; //
import { connectApsVisibilityDB } from "./config/apsVisibility/apsVisibilityDb.js";

// user list
import { connectUserListDB } from "./config/userListDB/userListDB.js";

// Databases
connectAdminCredentialsDB();
connectUniversityDB();
connectNewsletterDB();
connectSubjectsDB();
connectUniversityCoursesDB();
connectUserListDB();
connectApsVisibilityDB();

// Routes Connecters
import adminRoute from "./routes/admin/adminRoute.js";
import universityRouter from "./routes/addNewUniversity/universityAddRoute.js";
import universityViewEditRouter from "./routes/universityList/universityListRoute.js";
import contactRoute from "./routes/contact/contactRouter.js";
import subjectRoutes from "./routes/subjects/SubjectsRoute.js";
import getSingleUniversityRoute from "./routes/getSingleUniversity/getSingleUniversityRoute.js";
import newsletterRoutes from "./routes/subscribeToNewsletter/subscribeNewsLetterRoute.js";
import sendNewsletterRoute from "./routes/sendNewsLetter/sendNewsLettersRoute.js";
import userManagementRoute from "./routes/userManagement/userManagementRoute.js";
import universityCollectionsRoutes from "./routes/collectionNamesRoute/universityCollectionNames.js";
import courseDetailsRoutes from "./routes/collectionDetails/collectionDetails.js";
import apsRouter from "./routes/APSCalculator/ApsCalculationsRouter.js";
import adminUserRoutes from "./routes/adminUsers/adminUsersRoute.js";
import unavailableUniversitiesRoute from "./routes/unavailableUniversities/unavailableUniversitiesRoute.js";

// user Details
import apsUserRoute from "./routes/userListDetailsRoute.js";
import { startScheduledEmailWorker } from "./services/scheduledEmailWorker.js";

// Routes connectors
app.use("/api/universities-collections", universityCollectionsRoutes);
app.use("/api/courses", courseDetailsRoutes);
app.use("/api/aps", apsRouter);
app.use("/api/unavailable-universities", unavailableUniversitiesRoute);
app.use("/api/subscribe", newsletterRoutes);
app.use("/api/newsletter-subscribers", userManagementRoute);
app.use("/api/send-newsletter", sendNewsletterRoute);
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/api/admin-login", adminRoute); //admin route
app.use("/api/university/add", universityRouter); // POST to /api/university/add
app.use("/api/university", universityViewEditRouter); // GET, PUT, DELETE
app.use("/api/university", getSingleUniversityRoute);
app.use("/api/contact", contactRoute);
app.use("/api/subjects", subjectRoutes); // Mount the routes here
app.use("/api/admin/users", adminUserRoutes);

app.use("/api/user-list", apsUserRoute);

// Start DB-backed scheduled email worker (will respect SCHEDULER_ENABLED env var)
startScheduledEmailWorker();

// show the first 4 universities on the featured university page
app.get("/api/university", async (req, res) => {
    const limit = parseInt(req.query.limit) || 4; // Default to 4 if no limit is provided
    try {
        const universities = await UniversityDetail.find().limit(limit);
        res.json(universities);
    } catch (err) {
        console.error("Error fetching universities:", err);
        res.status(500).json({ message: "Server error" });
    }
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, "0.0.0.0", () => {
    console.log(`✅ Server running on port ${PORT}`);
});
