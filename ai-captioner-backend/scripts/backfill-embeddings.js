// scripts/backfill-embeddings.js
// Computes CLIP embeddings for posts that don't have one (posts created before Phase 4,
// or whose embedding failed at upload time).
// Usage: npm run search:backfill
import "dotenv/config";
import mongoose from "mongoose";
import { connectDB } from "../src/db/db.js";
import Post from "../src/models/Post.js";
import { embedImage } from "../src/services/embedding.service.js";

const run = async () => {
  await connectDB();
  const posts = await Post.find({ embedding: { $exists: false } }).select("image caption");
  console.log(`${posts.length} post(s) without an embedding`);

  let done = 0;
  for (const post of posts) {
    try {
      const response = await fetch(post.image);
      if (!response.ok) throw new Error(`image fetch failed (${response.status})`);
      const embedding = await embedImage(Buffer.from(await response.arrayBuffer()));
      await Post.updateOne({ _id: post._id }, { $set: { embedding } });
      done++;
      console.log(`✅ ${post._id} "${post.caption?.slice(0, 40)}"`);
    } catch (err) {
      console.error(`❌ ${post._id}: ${err.message}`);
    }
  }
  console.log(`Embedded ${done}/${posts.length} post(s)`);
};

run()
  .catch((err) => {
    console.error("❌", err.message);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
