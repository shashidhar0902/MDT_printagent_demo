import fs from "fs";
import path from "path";
import type { JobStatus, PrintJob } from "./types";

const DATA_DIR = path.join(process.cwd(), "data");
const DB_FILE = path.join(DATA_DIR, "jobs.json");

function ensureDb(): PrintJob[] {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (!fs.existsSync(DB_FILE) || fs.statSync(DB_FILE).size === 0) {
    fs.writeFileSync(DB_FILE, "[]", "utf-8");
    return [];
  }

  try {
    const raw = fs.readFileSync(DB_FILE, "utf-8").trim();
    if (!raw) {
      fs.writeFileSync(DB_FILE, "[]", "utf-8");
      return [];
    }

    const parsed = JSON.parse(raw) as PrintJob[];
    if (!Array.isArray(parsed)) {
      throw new Error("jobs.json does not contain an array");
    }

    return parsed;
  } catch (error) {
    console.error("Invalid jobs database, resetting to empty state:", error);
    fs.writeFileSync(DB_FILE, "[]", "utf-8");
    return [];
  }
}

function writeDb(jobs: PrintJob[]): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  fs.writeFileSync(DB_FILE, JSON.stringify(jobs, null, 2), "utf-8");
}

export function createJob(job: PrintJob): PrintJob {
  const jobs = ensureDb();
  jobs.push(job);
  writeDb(jobs);
  return job;
}

export function updateJobStatus(id: string, status: JobStatus): PrintJob | null {
  const jobs = ensureDb();
  const index = jobs.findIndex((j) => j.id === id);
  if (index === -1) return null;
  jobs[index] = { ...jobs[index], status };
  writeDb(jobs);
  return jobs[index];
}

export function getQueue(): PrintJob[] {
  const jobs = ensureDb();
  return jobs
    .filter((j) => j.status === "queued" || j.status === "printing")
    .sort((a, b) => {
      if (a.urgency !== b.urgency) {
        return a.urgency === "urgent" ? -1 : 1;
      }
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });
}

export function getJob(id: string): PrintJob | null {
  const jobs = ensureDb();
  return jobs.find((j) => j.id === id) ?? null;
}
