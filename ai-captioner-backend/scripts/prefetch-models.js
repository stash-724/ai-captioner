// scripts/prefetch-models.js
// Downloads the CLIP models into .model-cache at build time (Render runs this in the build
// command), so a cold start loads them from disk instead of downloading them again.
// Usage: npm run models:prefetch
import { preloadModels } from "../src/services/embedding.service.js";

preloadModels()
  .then(() => console.log("✅ CLIP models cached"))
  .catch((err) => {
    console.error("❌ Failed to download CLIP models:", err.message);
    process.exitCode = 1;
  });
