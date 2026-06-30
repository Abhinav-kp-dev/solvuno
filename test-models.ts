import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
dotenv.config();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function run() {
  const modelsToTest = [
    "gemini-2.5-flash-lite",
    "gemini-2.0-flash-lite",
    "gemini-2.0-flash-001"
  ];

  for (const model of modelsToTest) {
    try {
      console.log(`Testing model: ${model}`);
      const response = await ai.models.generateContent({
        model: model,
        contents: "Reply 'OK' if this works."
      });
      console.log(`Success for ${model}: ${response.text}`);
    } catch (err: any) {
      console.error(`Error for ${model}: ${err.message}`);
    }
  }
}

run();
