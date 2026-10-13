import { GoogleGenAI, createUserContent } from "@google/genai";
import { CAPTION_TONES, CAPTION_LENGTHS, DEFAULT_TONE, DEFAULT_LENGTH } from "../constants/caption.js";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const MODEL = process.env.GEMINI_MODEL || "gemini-3.8-flash";

// Gemini returns 503 when overloaded and 429 when rate-limited; both are usually temporary
const RETRYABLE_STATUSES = [429, 503];
const RETRY_DELAYS_MS = [1000, 3000];

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
      const canRetry = RETRYABLE_STATUSES.includes(err.status) && attempt < RETRY_DELAYS_MS.length;
      console.error(`Gemini AI caption error (attempt ${attempt + 1}${canRetry ? ", retrying" : ""}):`, err.message);
      if (canRetry) {
        await sleep(RETRY_DELAYS_MS[attempt]);
        continue;
      }

      const busy = RETRYABLE_STATUSES.includes(err.status);
      const error = new Error(busy
        ? "The caption service is busy right now, please try again in a minute"
        : "Caption generation failed, please try again");
      error.status = busy ? 503 : 502;
      throw error;
    }
  }
};
