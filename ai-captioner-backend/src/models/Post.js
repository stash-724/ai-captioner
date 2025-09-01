const mongoose = require("mongoose");

const postSchema = new mongoose.Schema({
    image: { type: String, required: true }, // URL or path to image
    caption: { type: String, required: false }, // optional, AI will generate if not given
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true } // ref to User model
}, { timestamps: true });

module.exports = mongoose.model("Post", postSchema);
