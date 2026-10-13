import { GoogleGenAI, createUserContent } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export const generateCaption = async (imageBuffer, mimeType, prompt = "Write a short, catchy caption for this image") => {
  try {
    const base64Image = imageBuffer.toString("base64");

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: createUserContent([
        {
          inlineData: {
            mimeType,
            data: base64Image,
          },
        },
        { text: prompt }
      ]),
    });

    if (!response.text) throw new Error("No caption returned");
    return response.text.trim();

  } catch (err) {
    console.error("Gemini AI caption error:", err);
    const error = new Error("Caption generation failed, please try again");
    error.status = 502;
    throw error;
  }
};
