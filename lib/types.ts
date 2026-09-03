export type ColorMode = "bw" | "color";
export type Urgency = "standard" | "urgent";
export type JobStatus =
  | "pending_payment"
  | "queued"
  | "printing"
  | "ready"
  | "collected"
  | "cancelled";

export type MachineId = "color-1" | "bw-1" | "bw-2";

export interface PrintSpec {
  copies: number;
  colorMode: ColorMode;
  duplex: boolean;
  urgency: Urgency;
}

export interface PrintPlan extends PrintSpec {
  summary: string;
  machineId: MachineId;
}

export interface PrintJob {
  id: string;
  studentName: string;
  fileName: string;
  fileNames?: string[];
  fileCount?: number;
  pageCount: number;
  copies: number;
  colorMode: ColorMode;
  duplex: boolean;
  urgency: Urgency;
  printPlan?: PrintPlan;
  machineId?: MachineId;
  costInRupees: number;
  status: JobStatus;
  createdAt: string;
  cancelledAt?: string;
  upiReference?: string;
}

export interface ParsedPreview {
  pageCount: number;
  spec: PrintSpec;
  fileName: string;
  fileCount?: number;
  files?: Array<{
    fileName: string;
    pageCount: number;
  }>;
}
