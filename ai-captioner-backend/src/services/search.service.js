// src/services/search.service.js
// Atlas Vector Search: finds the posts whose image embeddings are closest to a query vector.
// It uses an approximate nearest-neighbour (HNSW graph) index, so it doesn't compare every post.
import Post from "../models/Post.js";
import { EMBEDDING_DIMENSIONS } from "./embedding.service.js";

export const VECTOR_INDEX_NAME = "post_embedding_index";

export const VECTOR_INDEX_DEFINITION = {
  fields: [
    { type: "vector", path: "embedding", numDimensions: EMBEDDING_DIMENSIONS, similarity: "cosine" },
  ],
};

// Atlas reports cosine scores as (1 + cosine) / 2. CLIP text-image cosines are low
// (~0.15-0.35); below 0.2 the match is mostly noise, so drop those results.
const MIN_COSINE = Number(process.env.SEARCH_MIN_COSINE ?? 0.2);
const MIN_SCORE = (1 + MIN_COSINE) / 2;

export const findNearestPosts = async (queryVector, { limit = 12, excludeId } = {}) => {
  const results = await Post.aggregate([
    {
      $vectorSearch: {
        index: VECTOR_INDEX_NAME,
        path: "embedding",
        queryVector,
        numCandidates: limit * 20,
        limit: excludeId ? limit + 1 : limit,
      },
    },
    { $project: { embedding: 0, score: { $meta: "vectorSearchScore" } } },
    { $match: { score: { $gte: MIN_SCORE }, ...(excludeId && { _id: { $ne: excludeId } }) } },
    { $limit: limit },
  ]);

  return Post.populate(results, { path: "user", select: "username email" });
};
