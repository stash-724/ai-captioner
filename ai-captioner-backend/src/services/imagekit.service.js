import ImageKit from "imagekit";

const imagekit = new ImageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT,
});

const EXTENSIONS = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export const uploadImage = async (fileBuffer, mimeType) => {
  try {
    const result = await imagekit.upload({
      file: fileBuffer,
      fileName: `post_${Date.now()}.${EXTENSIONS[mimeType] || "jpg"}`,
      folder: "/ai-captioner"
    });
    console.log("Image uploaded:", result.url);
    return result.url;
  } catch (error) {
    console.error("ImageKit upload error:", error);
    throw new Error("Failed to upload image");
  }
};
