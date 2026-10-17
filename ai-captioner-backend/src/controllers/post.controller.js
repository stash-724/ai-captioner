import mongoose from "mongoose";
import Post from "../models/Post.js";
import { uploadImage } from "../services/imagekit.service.js";
import { generateCaption, buildCaptionPrompt } from "../services/ai.service.js";
import { embedImage, embedText } from "../services/embedding.service.js";
import { prepareImage } from "../services/image.service.js";
import { findNearestPosts } from "../services/search.service.js";
import { CAPTION_TONES, CAPTION_LENGTHS, DEFAULT_TONE, DEFAULT_LENGTH } from "../constants/caption.js";

// Reads optional tone/length; returns an error message if either value is unknown
const parseCaptionOptions = (body = {}, defaults = {}) => {
  const tone = body.tone || defaults.tone || DEFAULT_TONE;
  const length = body.length || defaults.length || DEFAULT_LENGTH;
  if (!Object.hasOwn(CAPTION_TONES, tone)) {
    return { error: `tone must be one of: ${Object.keys(CAPTION_TONES).join(", ")}` };
  }
  if (!Object.hasOwn(CAPTION_LENGTHS, length)) {
    return { error: `length must be one of: ${Object.keys(CAPTION_LENGTHS).join(", ")}` };
  }
  return { tone, length };
};

// @desc Create new post
// @route POST /api/posts
// @access Private
export const createPost = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No image provided" });
    }

    const { tone, length, error } = parseCaptionOptions(req.body);
    if (error) return res.status(400).json({ message: error });

    // Downscale before captioning, embedding and storing (keeps memory low on small servers)
    const { buffer, mimetype } = await prepareImage(req.file.buffer, req.file.mimetype);

    // Caption (Gemini) and CLIP embedding (local) run in parallel, before the upload,
    // so a Gemini failure doesn't leave an orphaned image. A failed embedding doesn't
    // block the post; it just won't appear in search until backfilled.
    const [caption, embedding] = await Promise.all([
      generateCaption(buffer, mimetype, buildCaptionPrompt({ tone, length })),
      embedImage(buffer).catch((err) => {
        console.error("CLIP embedding failed:", err.message);
        return undefined;
      }),
    ]);
    console.log("Generated caption:", caption);

    const imageUrl = await uploadImage(buffer, mimetype);

    const newPost = new Post({
      image: imageUrl,
      caption,
      tone,
      length,
      embedding,
      user: req.user.id,
    });

    await newPost.save();
    res.status(201).json(newPost);

  } catch (error) {
    console.error("Error creating post:", error);
    if (error.status) return res.status(error.status).json({ message: error.message });
    res.status(500).json({ message: "Internal server error" });
  }
};

// @desc Get all posts
// @route GET /api/posts
// @access Public
export const getPosts = async (req, res) => {
  try {
    const posts = await Post.find().sort({ createdAt: -1 }).populate("user", "username email");
    res.json(posts);
  } catch (error) {
    console.error("Error fetching posts:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// @desc Get posts of logged-in user
// @route GET /api/posts/me
// @access Private
export const getUserPosts = async (req, res) => {
  try {
    const posts = await Post.find({ user: req.user.id }).sort({ createdAt: -1 }).populate("user", "username email");
    res.json(posts);
  } catch (error) {
    console.error("Error fetching user posts:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// @desc Delete a post
// @route DELETE /api/posts/:id
// @access Private
export const deletePost = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid post id" });
    }

    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });
    if (post.user.toString() !== req.user.id) return res.status(403).json({ message: "Unauthorized" });

    await post.deleteOne();
    res.json({ message: "Post deleted successfully" });
  } catch (error) {
    console.error("Error deleting post:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// @desc Regenerate a post's caption, optionally with a new tone/length
// @route POST /api/posts/:id/regenerate
// @access Private
export const regenerateCaption = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid post id" });
    }

    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });
    if (post.user.toString() !== req.user.id) return res.status(403).json({ message: "Unauthorized" });

    // Unspecified options keep the post's current tone/length
    const { tone, length, error } = parseCaptionOptions(req.body, post);
    if (error) return res.status(400).json({ message: error });

    // Fetch the stored image back from ImageKit
    const imageRes = await fetch(post.image);
    if (!imageRes.ok) throw new Error(`Failed to fetch image (${imageRes.status})`);
    const { buffer, mimetype } = await prepareImage(
      Buffer.from(await imageRes.arrayBuffer()),
      imageRes.headers.get("content-type")?.split(";")[0] || "image/jpeg"
    );

    post.caption = await generateCaption(buffer, mimetype, buildCaptionPrompt({ tone, length }));
    post.tone = tone;
    post.length = length;
    await post.save();
    await post.populate("user", "username email");

    res.json(post);
  } catch (error) {
    console.error("Error regenerating caption:", error);
    if (error.status) return res.status(error.status).json({ message: error.message });
    res.status(500).json({ message: "Internal server error" });
  }
};

const parseLimit = (value, fallback = 12) => Math.min(Math.max(Number.parseInt(value, 10) || fallback, 1), 50);

// @desc Text-to-image semantic search: embed the query with CLIP, find the closest images
// @route GET /api/posts/search?q=...&limit=12
// @access Public
export const searchPosts = async (req, res) => {
  try {
    const query = typeof req.query.q === "string" ? req.query.q.trim() : "";
    if (!query) return res.status(400).json({ message: "Search query (q) is required" });
    if (query.length > 200) return res.status(400).json({ message: "Search query is too long" });

    const queryVector = await embedText(query);
    const posts = await findNearestPosts(queryVector, { limit: parseLimit(req.query.limit) });
    res.json(posts);
  } catch (error) {
    console.error("Error searching posts:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// @desc Image-to-image search: posts whose images are closest to this post's image
// @route GET /api/posts/:id/similar?limit=12
// @access Public
export const getSimilarPosts = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid post id" });
    }

    const post = await Post.findById(req.params.id).select("+embedding");
    if (!post) return res.status(404).json({ message: "Post not found" });
    if (!post.embedding?.length) {
      return res.status(409).json({ message: "This post has no image embedding yet" });
    }

    const posts = await findNearestPosts(post.embedding, {
      limit: parseLimit(req.query.limit),
      excludeId: post._id,
    });
    res.json(posts);
  } catch (error) {
    console.error("Error finding similar posts:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
