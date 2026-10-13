// src/constants/caption.js
// Caption style options; the descriptions are built into the Gemini prompt
export const CAPTION_TONES = {
  witty: "witty and playful, with clever wordplay",
  formal: "formal and professional",
  poetic: "poetic and evocative, with vivid imagery",
  descriptive: "neutral and descriptive, plainly stating what is in the image",
};

export const CAPTION_LENGTHS = {
  short: "no more than 8 words",
  medium: "a single sentence of 10 to 20 words",
  long: "2 to 3 sentences",
};

export const DEFAULT_TONE = "witty";
export const DEFAULT_LENGTH = "short";
