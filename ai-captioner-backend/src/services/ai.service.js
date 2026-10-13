import { GoogleGenAI, createUserContent } from "@google/genai";
import { CAPTION_TONES, CAPTION_LENGTHS, DEFAULT_TONE, DEFAULT_LENGTH } from "../constants/caption.js";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const MODEL = process.env.GEMINI_MODEL || "gemini-3.8-flash";

// Gemini returns 503 when the model is overloaded, which is usually temporary, so retry with backoff.
// 429 means a quota is used up (the free tier has a daily per-model limit); retrying would only waste requests.
const RETRY_DELAYS_MS = [2000, 5000, 10000];

export const buildCaptionPrompt = ({ tone = DEFAULT_TONE, length = DEFAULT_LENGTH } = {}) =>
  `Write a ${CAPTION_TONES[tone]} caption for this image. Length: ${CAPTION_LENGTHS[length]}. ` +
  "Reply with only the caption text, without quotes, hashtags or any explanation.";

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Models sometimes wrap the caption in quotes despite the instructions
const cleanCaption = (text) => text.trim().replace(/^["'“”]+|["'“”]+$/g, "").trim();

export const generateCaption = async (imageBuffer, mimeType, prompt = buildCaptionPrompt()) => {
  const contents = createUserContent([
    {
      inlineData: {
        mimeType,
        data: imageBuffer.toString("base64"),
      },
    },
    { text: prompt }
  ]);

  for (let attempt = 0; ; attempt++) {
    try {
      const response = await ai.models.generateContent({ model: MODEL, contents });

      if (!response.text) throw new Error("No caption returned");
      return cleanCaption(response.text);

    } catch (err) {
      const canRetry = err.status === 503 && attempt < RETRY_DELAYS_MS.length;
      console.error(`Gemini AI caption error (attempt ${attempt + 1}${canRetry ? ", retrying" : ""}):`, err.message);
      if (canRetry) {
        await sleep(RETRY_DELAYS_MS[attempt]);
        continue;
      }

      const error = new Error("Caption generation failed, please try again");
      error.status = 502;
      if (err.status === 503) {
        error.message = "The caption service is busy right now, please try again in a minute";
        error.status = 503;
      } else if (err.status === 429) {
        error.message = "Caption limit reached, please try again later";
        error.status = 429;
      }
      throw error;
    }
  }
};
