import mongoose from "mongoose";
export const runtime = 'nodejs';
const MONGODB_URI = process.env.MONGO_URI || process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error("Please define the MONGODB_URI environment variable");
}

interface MongooseCache {
    conn: typeof mongoose | null;
    promise: Promise<typeof mongoose> | null;
}


declare global {
  var mongoose: MongooseCache;
}

let cached: MongooseCache= global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

export default async function dbConnect():Promise<typeof mongoose> {
  if (cached.conn) {
    return cached.conn;
  }

    if (!cached.promise) {
        const opts = {
            bufferCommands: false,
        };

        cached.promise = mongoose.connect(MONGODB_URI as string, opts).then((mongoose) => {
            return mongoose;
        });
    }

    try{
        cached.conn = await cached.promise;
    }catch (error) {
        cached.promise = null;
        throw error;
    }
    return cached.conn;
}

