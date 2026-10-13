import { GoogleGenAI, createUserContent } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const MODEL = process.env.GEMINI_MODEL || "gemini-3.8-flash";

// Gemini returns 503 when overloaded and 429 when rate-limited; both are usually temporary
const RETRYABLE_STATUSES = [429, 503];
const RETRY_DELAYS_MS = [1000, 3000];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const generateCaption = async (imageBuffer, mimeType, prompt = "Write a short, catchy caption for this image") => {
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
      return response.text.trim();

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
