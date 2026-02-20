import mongoose from "mongoose";

const connectDB = async () => {
  try {
    const connectionInstance = await mongoose.connect(
      `${process.env.MONGO_URI}bareMinimumDB`,
    );
    console.log(`MONGODB CONNECTED: ${connectionInstance.connection.host}`);
  } catch (error) {
    console.log("MONOGODB ERROR".error);
  }
};

export default connectDB;
