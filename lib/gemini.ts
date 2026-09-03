import { GoogleGenAI } from "@google/genai";
import type { PrintSpec } from "./types";

const DEFAULTS: PrintSpec = {
  copies: 1,
  colorMode: "bw",
  duplex: true,
  urgency: "standard",
};

const SYSTEM_PROMPT = `You extract print job specifications from natural language instructions.
Return ONLY valid JSON with this exact shape:
{"copies": number, "colorMode": "bw"|"color", "duplex": boolean, "urgency": "standard"|"urgent"}

Rules:
- copies: integer >= 1
- colorMode: "color" if user wants color/coloured printing, else "bw"
- duplex: true for double-sided, back-to-back, both sides; false for single-sided
- urgency: "urgent" if user needs it quickly, ASAP, tomorrow, today, rush; else "standard"
- Interpret natural phrases and synonyms, including "photocopy", "xerox", "hard copy", "both faces", "front and back", "one face", "monochrome", "colour print", "as soon as possible", and "before class".
- If the user gives a number near copy/print/x/sets, use it as copies. Do not treat page counts as copies.
- When instructions conflict, use the most recent explicit instruction.
- Default missing fields: copies=1, colorMode="bw", duplex=true, urgency="standard"`;

function parseJsonResponse(text: string): PrintSpec {
  const cleaned = text.replace(/```json\n?|\n?```/g, "").trim();
  const parsed = JSON.parse(cleaned) as Partial<PrintSpec>;

  return {
    copies: Math.max(1, Number(parsed.copies) || DEFAULTS.copies),
    colorMode: parsed.colorMode === "color" ? "color" : "bw",
    duplex: typeof parsed.duplex === "boolean" ? parsed.duplex : DEFAULTS.duplex,
    urgency: parsed.urgency === "urgent" ? "urgent" : "standard",
  };
}

function fallbackExtract(instructionText: string): PrintSpec {
  const text = instructionText.toLowerCase();
  const copiesMatch = text.match(/(\d+)\s*(copies|copy|x)/);
  const copies = copiesMatch ? parseInt(copiesMatch[1], 10) : 1;
  const colorMode = /\b(color|colour|colored|coloured)\b/.test(text) ? "color" : "bw";
  const duplex = /\b(single[- ]?sided|one[- ]?sided|front only)\b/.test(text)
    ? false
    : /\b(duplex|double[- ]?sided|back[- ]?to[- ]?back|both sides)\b/.test(text) || DEFAULTS.duplex;
  const urgency = /\b(urgent|urgently|asap|rush|today|tomorrow|fast|quickly)\b/.test(text)
    ? "urgent"
    : "standard";

  return { copies: Math.max(1, copies), colorMode, duplex, urgency };
}

export async function extractPrintSpec(instructionText: string): Promise<PrintSpec> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return fallbackExtract(instructionText);

  const client = new GoogleGenAI({ apiKey });

  try {
    const result = await client.models.generateContent({
      model: "gemini-3.6-flash",
      contents: `${SYSTEM_PROMPT}\n\nUser instructions:\n${instructionText}`,
      config: {
        responseMimeType: "application/json",
        temperature: 0,
      },
    });
    return parseJsonResponse(result.text ?? "");
  } catch (error) {
    console.error("Gemini instruction parsing failed:", error);
    const status = typeof error === "object" && error !== null && "status" in error
      ? (error as { status?: number }).status
      : undefined;
    if (status === 401 || status === 403) {
      throw new Error("Gemini authentication failed. Create a Gemini API key in Google AI Studio and replace GEMINI_API_KEY.");
    }
    throw new Error("Gemini could not interpret the instructions. Check GEMINI_API_KEY and try again.");
  }
}