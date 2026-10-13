// scripts/create-vector-index.js
// Creates the Atlas Vector Search index on posts.embedding (once per cluster) and waits until it is queryable.
// Usage: npm run search:index
import "dotenv/config";
import mongoose from "mongoose";
import { connectDB } from "../src/db/db.js";
import Post from "../src/models/Post.js";
import { VECTOR_INDEX_NAME, VECTOR_INDEX_DEFINITION } from "../src/services/search.service.js";

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const run = async () => {
  await connectDB();
  // The collection must exist before a search index can be created on it
  await Post.createCollection();

  const existing = await Post.collection.listSearchIndexes(VECTOR_INDEX_NAME).toArray();
  if (existing.length) {
    console.log(`Index "${VECTOR_INDEX_NAME}" already exists (status: ${existing[0].status})`);
  } else {
    await Post.collection.createSearchIndex({
      name: VECTOR_INDEX_NAME,
      type: "vectorSearch",
      definition: VECTOR_INDEX_DEFINITION,
    });
    console.log(`Creating index "${VECTOR_INDEX_NAME}"...`);
  }

  // Building takes from a few seconds to a minute
  for (let i = 0; i < 60; i++) {
    const [index] = await Post.collection.listSearchIndexes(VECTOR_INDEX_NAME).toArray();
    if (index?.queryable) {
      console.log(`✅ Index is ready (status: ${index.status})`);
      return;
    }
    console.log(`   status: ${index?.status ?? "pending"}...`);
    await sleep(5000);
  }
  throw new Error("Timed out waiting for the index to become queryable");
};

run()
  .catch((err) => {
    console.error("❌", err.message);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
