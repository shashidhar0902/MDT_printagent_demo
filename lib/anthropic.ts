import Anthropic from "@anthropic-ai/sdk";
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
- Default missing fields: copies=1, colorMode="bw", duplex=true, urgency="standard"`;

function parseJsonResponse(text: string): PrintSpec {
  const cleaned = text.replace(/```json\n?|\n?```/g, "").trim();
  const parsed = JSON.parse(cleaned) as Partial<PrintSpec>;

  return {
    copies: Math.max(1, Number(parsed.copies) || DEFAULTS.copies),
    colorMode: parsed.colorMode === "color" ? "color" : "bw",
    duplex: parsed.duplex ?? DEFAULTS.duplex,
    urgency: parsed.urgency === "urgent" ? "urgent" : "standard",
  };
}

/** Simple regex fallback when no API key is configured */
function fallbackExtract(instructionText: string): PrintSpec {
  const text = instructionText.toLowerCase();

  const copiesMatch = text.match(/(\d+)\s*(copies|copy|x)/);
  const copies = copiesMatch ? parseInt(copiesMatch[1], 10) : 1;

  const colorMode =
    /\b(color|colour|colored|coloured)\b/.test(text) ? "color" : "bw";

  const duplex =
    /\b(single[- ]?sided|one[- ]?sided|front only)\b/.test(text)
      ? false
      : /\b(duplex|double[- ]?sided|back[- ]?to[- ]?back|both sides)\b/.test(
            text,
          ) || DEFAULTS.duplex;

  const urgency =
    /\b(urgent|urgently|asap|rush|today|tomorrow|fast|quickly)\b/.test(text)
      ? "urgent"
      : "standard";

  return { copies: Math.max(1, copies), colorMode, duplex, urgency };
}

export async function extractPrintSpec(
  instructionText: string,
): Promise<PrintSpec> {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    return fallbackExtract(instructionText);
  }

  const client = new Anthropic({ apiKey });

  const attempt = async (strict: boolean): Promise<PrintSpec> => {
    const message = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 256,
      system: strict
        ? SYSTEM_PROMPT +
          "\nRespond with raw JSON only. No markdown, no explanation."
        : SYSTEM_PROMPT,
      messages: [{ role: "user", content: instructionText }],
    });

    const block = message.content[0];
    if (block.type !== "text") {
      throw new Error("Unexpected response type from Claude");
    }

    return parseJsonResponse(block.text);
  };

  try {
    return await attempt(false);
  } catch {
    return await attempt(true);
  }
}
