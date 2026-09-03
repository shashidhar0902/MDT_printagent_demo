import type { MachineId, PrintPlan, PrintSpec } from "./types";

export const MAX_FILE_SIZE_BYTES = 100 * 1024 * 1024;
export const MAX_PAGES_PER_ORDER = 1000;
export const PAYMENT_TIMEOUT_MS = 10 * 60 * 1000;
export const CANCELLED_RETENTION_MS = 10 * 60 * 60 * 1000;

let nextBwMachine = 0;

function chooseMachine(colorMode: PrintSpec["colorMode"]): MachineId {
  if (colorMode === "color") return "color-1";
  const machine: MachineId = nextBwMachine === 0 ? "bw-1" : "bw-2";
  nextBwMachine = (nextBwMachine + 1) % 2;
  return machine;
}

export function createPrintPlan(spec: PrintSpec): PrintPlan {
  const sideText = spec.duplex ? "double-sided" : "single-sided";
  const colorText = spec.colorMode === "color" ? "color" : "black and white";
  const urgencyText = spec.urgency === "urgent" ? ", urgent" : "";

  return {
    ...spec,
    machineId: chooseMachine(spec.colorMode),
    summary: `${spec.copies} ${colorText} ${sideText} ${spec.copies === 1 ? "copy" : "copies"}${urgencyText}`,
  };
}