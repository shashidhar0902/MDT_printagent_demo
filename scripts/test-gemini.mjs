import fs from "node:fs";
import { GoogleGenAI } from "@google/genai";

function readGeminiKey() {
  const envPath = ".env.local";
  if (!fs.existsSync(envPath)) return "";

  const line = fs
    .readFileSync(envPath, "utf8")
    .split(/\r?\n/)
    .find((entry) => /^\s*GEMINI_API_KEY\s*=/.test(entry));

  return line?.replace(/^\s*GEMINI_API_KEY\s*=\s*/, "").trim() ?? "";
}

const apiKey = readGeminiKey();
if (!apiKey) {
  console.error("FAIL: GEMINI_API_KEY is missing from .env.local");
  process.exit(1);
}

console.log(`Key found (length ${apiKey.length}); value is hidden.`);

try {
  const ai = new GoogleGenAI({ apiKey });
  const response = await ai.models.generateContent({
    model: "gemini-3.6-flash",
    contents: "Reply with exactly the word OK.",
  });

  console.log("PASS: Gemini accepted the key and returned:");
  console.log(response.text ?? "<empty response>");
} catch (error) {
  const status = typeof error === "object" && error !== null && "status" in error
    ? error.status
    : "unknown";
  console.error(`FAIL: Gemini request failed (status ${status}).`);
  console.error("The key was not printed. Check the detailed error below:");
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
