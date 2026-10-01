const mongoose = require("mongoose");

// Connect to MongoDB Atlas or local MongoDB
const connectDB = async () => {
    try {
        const uri = process.env.MONGO_URI;

        if (!uri) {
            console.error("MongoDB Connection Error: MONGO_URI is not defined in environment variables");
            process.exit(1);
        }

        await mongoose.connect(uri);
        console.log("MongoDB Connected");
    } catch (error) {
        console.error(`MongoDB Connection Error: ${error.message}`);
        process.exit(1);
    }
};

module.exports = { connectDB };
