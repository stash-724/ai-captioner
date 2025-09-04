import { GoogleGenAI, createUserContent, createPartFromUri } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export const generateCaption = async (imageBuffer, prompt = "Write a short, catchy caption for this image") => {
  try {
    const base64Image = imageBuffer.toString("base64");

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: createUserContent([
        {
          inlineData: {
            mimeType: "image/jpeg",
            data: base64Image,
          },
        },
        { text: prompt }
      ]),
    });

    if (!response.text) throw new Error("No caption returned");
    return response.text;

  } catch (err) {
    console.error("Gemini AI caption error:", err);
    return "AI caption unavailable";
  }
};
