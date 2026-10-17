// src/services/embedding.service.js
// CLIP maps images and text into the same 512-dimensional vector space, so a text query
// can be compared directly with image embeddings (cosine similarity) for semantic search.
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  AutoProcessor,
  AutoTokenizer,
  CLIPTextModelWithProjection,
  CLIPVisionModelWithProjection,
  RawImage,
  env,
} from "@huggingface/transformers";

// Keep downloaded models inside the project, so a build step can fetch them once
// (npm run models:prefetch) and production starts without re-downloading ~150 MB
env.cacheDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../.model-cache");

const MODEL_ID = "Xenova/clip-vit-base-patch32";
// 8-bit quantized weights: ~154 MB instead of ~606 MB, with a negligible accuracy cost
const DTYPE = "q8";

export const EMBEDDING_DIMENSIONS = 512;

let modelsPromise = null;

// Models are downloaded on first use (then cached on disk) and kept in memory
const loadModels = () => {
  modelsPromise ??= (async () => {
    const start = Date.now();
    const [processor, tokenizer, visionModel, textModel] = await Promise.all([
      AutoProcessor.from_pretrained(MODEL_ID),
      AutoTokenizer.from_pretrained(MODEL_ID),
      CLIPVisionModelWithProjection.from_pretrained(MODEL_ID, { dtype: DTYPE }),
      CLIPTextModelWithProjection.from_pretrained(MODEL_ID, { dtype: DTYPE }),
    ]);
    console.log(`🧠 CLIP models loaded in ${Date.now() - start} ms`);
    return { processor, tokenizer, visionModel, textModel };
  })().catch((err) => {
    modelsPromise = null; // allow a retry on the next request
    throw err;
  });
  return modelsPromise;
};

export const preloadModels = loadModels;

// Start loading in the background so the first upload or search isn't slow
export const warmUpEmbeddings = () =>
  loadModels().catch((err) => console.error("Failed to load CLIP models:", err.message));

// Scale to length 1, so cosine similarity is just a dot product
const normalize = (values) => {
  const length = Math.hypot(...values);
  return values.map((v) => v / length);
};

export const embedImage = async (imageBuffer) => {
  const { processor, visionModel } = await loadModels();
  const image = await RawImage.fromBlob(new Blob([imageBuffer]));
  const { image_embeds } = await visionModel(await processor(image));
  return normalize(Array.from(image_embeds.data));
};

export const embedText = async (text) => {
  const { tokenizer, textModel } = await loadModels();
  const inputs = tokenizer([text], { padding: true, truncation: true });
  const { text_embeds } = await textModel(inputs);
  return normalize(Array.from(text_embeds.data));
};
