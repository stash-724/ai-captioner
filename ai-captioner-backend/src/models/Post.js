import mongoose from "mongoose";
import { CAPTION_TONES, CAPTION_LENGTHS, DEFAULT_TONE, DEFAULT_LENGTH } from "../constants/caption.js";

const postSchema = new mongoose.Schema(
  {
    image: { type: String, required: true }, // URL or path to image
    caption: { type: String }, // optional
    tone: { type: String, enum: Object.keys(CAPTION_TONES), default: DEFAULT_TONE },
    length: { type: String, enum: Object.keys(CAPTION_LENGTHS), default: DEFAULT_LENGTH },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // ref to User
  },
  { timestamps: true }
);

const Post = mongoose.model("Post", postSchema);

export default Post;
