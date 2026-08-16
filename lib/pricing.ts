import type { PrintJob } from "./types";

type CostInput = Pick<
  PrintJob,
  "pageCount" | "copies" | "colorMode" | "duplex" | "urgency"
>;

export function calculateCost(job: CostInput): number {
  const { pageCount, copies, colorMode, duplex, urgency } = job;

  let ratePerPage: number;
  if (colorMode === "color") {
    ratePerPage = duplex ? 6 : 8;
  } else {
    ratePerPage = duplex ? 1.0 : 1.5;
  }

  let total = pageCount * copies * ratePerPage;

  if (urgency === "urgent") {
    total *= 1.2;
  }

  return Math.round(total * 100) / 100;
}
