import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI!;

if (!MONGODB_URI) {
  throw new Error("Please define the MONGODB_URI environment variable inside .env.local");
}

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

// Use global variable to cache the mongoose connection in development
let cached: MongooseCache = (global as any).mongoose;

if (!cached) {
  cached = (global as any).mongoose = { conn: null, promise: null };
}

async function connectToDatabase(): Promise<typeof mongoose> {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    console.log("🔄 Attempting to connect to MongoDB...");
    
    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      console.log("✅ Connected to MongoDB successfully");
      return mongoose;
    }).catch((error) => {
      console.error("❌ MongoDB connection error:", error.message);
      console.error("Full error:", error);
      cached.promise = null; // Reset promise on error
      
      // Throw a more specific error message
      if (error.message.includes("authentication")) {
        throw new Error("Database authentication failed. Check your credentials.");
      } else if (error.message.includes("network") || error.message.includes("timeout")) {
        throw new Error("Database network error. Check your connection.");
      } else {
        throw new Error("Database connection failed");
      }
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

export { connectToDatabase };