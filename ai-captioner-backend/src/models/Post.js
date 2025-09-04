import mongoose from "mongoose";

const postSchema = new mongoose.Schema(
  {
    image: { type: String, required: true }, // URL or path to image
    caption: { type: String }, // optional
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // ref to User
  },
  { timestamps: true }
);

const Post = mongoose.model("Post", postSchema);

export default Post;
