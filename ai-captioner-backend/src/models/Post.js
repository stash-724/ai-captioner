import mongoose from "mongoose";
import { CAPTION_TONES, CAPTION_LENGTHS, DEFAULT_TONE, DEFAULT_LENGTH } from "../constants/caption.js";

const postSchema = new mongoose.Schema(
  {
    image: { type: String, required: true }, // URL or path to image
    caption: { type: String }, // optional
    tone: { type: String, enum: Object.keys(CAPTION_TONES), default: DEFAULT_TONE },
    length: { type: String, enum: Object.keys(CAPTION_LENGTHS), default: DEFAULT_LENGTH },
    // CLIP image embedding (512 floats) used by Atlas Vector Search; excluded from queries by default
    embedding: { type: [Number], select: false, default: undefined },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // ref to User
  },
  {
    timestamps: true,
    // Never send the embedding to clients, even when it was loaded
    toJSON: {
      transform: (doc, ret) => {
        delete ret.embedding;
        return ret;
      },
    },
  }
);

const Post = mongoose.model("Post", postSchema);

export default Post;
