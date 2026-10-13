import "dotenv/config";
import app from "./app.js";
import { connectDB } from "./db/db.js";
import { warmUpEmbeddings } from "./services/embedding.service.js";

const PORT = process.env.PORT || 5000;

const start = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`🚀 Server running at http://localhost:${PORT}`);
      warmUpEmbeddings();
    });
  } catch (err) {
    console.error("Failed to start server:", err);
    process.exit(1);
  }
};

start();
