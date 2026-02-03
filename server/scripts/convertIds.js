import dotenv from "dotenv";
import {
    universityCoursesDbConnection,
    connectUniversityCoursesDB,
} from "../config/coursesDB/coursesDb.js";
import { ObjectId } from "mongodb";
dotenv.config();

const convertIds = async () => {
    await connectUniversityCoursesDB();
    const collections = await universityCoursesDbConnection.db
        .listCollections()
        .toArray();

    for (const coll of collections) {
        const collName = coll.name;
        const collection = universityCoursesDbConnection.collection(collName);
        const docs = await collection.find({}).toArray();

        for (const doc of docs) {
            if (
                typeof doc._id === "string" &&
                doc._id.match(/^[a-f\d]{24}$/i)
            ) {
                const newId = new ObjectId(doc._id);
                doc._id = newId;
                await collection.insertOne(doc);
                await collection.deleteOne({ _id: doc._id.toString() });
                console.log(
                    `Converted _id for collection ${collName}: ${newId}`
                );
            }
        }
    }
    console.log("Conversion complete.");
    process.exit(0);
};

convertIds();
