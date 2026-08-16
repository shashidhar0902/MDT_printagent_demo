export type ColorMode = "bw" | "color";
export type Urgency = "standard" | "urgent";
export type JobStatus =
  | "pending_payment"
  | "queued"
  | "printing"
  | "done";

export interface PrintSpec {
  copies: number;
  colorMode: ColorMode;
  duplex: boolean;
  urgency: Urgency;
}

export interface PrintJob {
  id: string;
  studentName: string;
  fileName: string;
  pageCount: number;
  copies: number;
  colorMode: ColorMode;
  duplex: boolean;
  urgency: Urgency;
  costInRupees: number;
  status: JobStatus;
  createdAt: string;
  upiReference?: string;
}

export interface ParsedPreview {
  pageCount: number;
  spec: PrintSpec;
  fileName: string;
}
