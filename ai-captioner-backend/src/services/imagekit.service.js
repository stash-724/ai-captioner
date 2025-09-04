import ImageKit from "imagekit";

const imagekit = new ImageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT,
});

export const uploadImage = async (file) => {
  try {
    const result = await imagekit.upload({
      file, // base64 string or file buffer
      fileName: `post_${Date.now()}.jpg`,
      folder: "/ai-captioner"
    });
    console.log("Image uploaded:", result.url);
    return result.url;
  } catch (error) {
    console.error("ImageKit upload error:", error);
    throw new Error("Failed to upload image");
  }
};
