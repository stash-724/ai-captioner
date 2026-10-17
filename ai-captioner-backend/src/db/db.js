import dns from "node:dns";
import mongoose from "mongoose";
export const connectDB = async () => {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI not found in .env");

  // Optional: some Windows setups give Node a local DNS resolver that refuses the
  // SRV lookup mongodb+srv:// needs. DNS_SERVERS=8.8.8.8,1.1.1.1 overrides it.
  if (process.env.DNS_SERVERS) {
    dns.setServers(process.env.DNS_SERVERS.split(",").map((s) => s.trim()));
  }
  mongoose.set("strictQuery", true);
  try {
    await mongoose.connect(uri);
    console.log("✅ MongoDB connected");
  } catch (err) {
    console.error("❌ MongoDB connection failed:", err.message);
    throw err;
  }
};
