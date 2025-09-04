import Post from "../models/Post.js";
import { uploadImage } from "../services/imagekit.service.js";
import { generateCaption } from "../services/ai.service.js";

export const createPost = async (req, res) => {
  try {
    const { caption } = req.body;
    const file = req.file; // assuming you use multer for file upload
    if (!file) return res.status(400).json({ message: "Image is required" });

    const imageUrl = await uploadImage(file.buffer, file.originalname);

    let finalCaption = caption;
    if (!caption) {
      const base64 = file.buffer.toString("base64");
      finalCaption = await generateCaption(base64);
    }

    const newPost = new Post({
      image: imageUrl,
      caption: finalCaption,
      user: req.user._id,
    });

    await newPost.save();
    res.status(201).json(newPost);
  } catch (err) {
    console.error("Post creation error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};
