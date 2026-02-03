import mongoose, { Mongoose } from "mongoose";

// Create a separate connection instance
const userListDbConnection = mongoose.createConnection();

export const connectUserListDB = async () => {
    try {
        await userListDbConnection.openUri(process.env.MONGO_URI, {
            dbName: "UserList", // ✅ this is your target DB

            // useNewUrlParser: true,
            // useUnifiedTopology: true,
        });
        console.log("✅ MongoDB connected to userList database");
        return userListDbConnection;
    } catch (error) {
        console.error("❌ userList DB error:", error.message);
        process.exit(1);
    }
};

export { userListDbConnection };
