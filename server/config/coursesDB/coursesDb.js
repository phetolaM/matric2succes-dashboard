import mongoose, { Mongoose } from "mongoose";
const universityCoursesDbConnection = mongoose.createConnection();

export const connectUniversityCoursesDB = async () => {
  try {
    await universityCoursesDbConnection.openUri(process.env.MONGO_URI, {
      dbName: "universityCourses",
      // useNewUrlParser: true,
      // useUnifiedTopology: true,
    });
    console.log("✅ Connected to universityCourses DB");
    return universityCoursesDbConnection;
  } catch (err) {
    console.error("❌ universityCourses DB connection failed:", err.message);
    process.exit(1);
  }
};

export { universityCoursesDbConnection };
