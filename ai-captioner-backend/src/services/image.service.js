// src/services/image.service.js
// Shrinks uploads before anything else touches them. A full-resolution phone photo
// (e.g. 5184x3456) decoded for CLIP needs ~120 MB more memory, which crashed the
// 512 MB free Render instance. CLIP only looks at 224x224 pixels and the feed shows
// 640 px wide images, so 1600 px is plenty.
import sharp from "sharp";

// Lower memory: no libvips operation cache, one thread per image
sharp.cache(false);
sharp.concurrency(1);

export const MAX_IMAGE_DIMENSION = 1600;

const OUTPUT = {
  "image/jpeg": ["jpeg", { quality: 85 }],
  "image/png": ["png", { compressionLevel: 9 }],
  "image/webp": ["webp", { quality: 85 }],
};

export const prepareImage = async (buffer, mimetype) => {
  const [format, options] = OUTPUT[mimetype] ?? OUTPUT["image/jpeg"];
  try {
    const resized = await sharp(buffer, { sequentialRead: true })
      .rotate() // apply the EXIF orientation; output also drops EXIF metadata such as GPS location
      .resize({ width: MAX_IMAGE_DIMENSION, height: MAX_IMAGE_DIMENSION, fit: "inside", withoutEnlargement: true })
      .toFormat(format, options)
      .toBuffer();
    return { buffer: resized, mimetype: `image/${format}` };
  } catch {
    const error = new Error("Could not read the image. Please upload a valid JPEG, PNG or WebP file.");
    error.status = 400;
    throw error;
  }
};
