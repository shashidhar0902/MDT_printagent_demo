"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type { PrintJob } from "@/lib/types";

function specSummary(job: PrintJob): string {
  const color = job.colorMode === "color" ? "Color" : "B&W";
  const sides = job.duplex ? "duplex" : "single";
  return `${job.copies}× ${color} ${sides} · ${job.pageCount} pg`;
}

function statusBadge(status: PrintJob["status"]) {
  const styles: Record<PrintJob["status"], string> = {
    pending_payment: "bg-yellow-100 text-yellow-800",
    queued: "bg-blue-100 text-blue-800",
    printing: "bg-purple-100 text-purple-800",
    ready: "bg-amber-100 text-amber-800",
    collected: "bg-green-100 text-green-800",
    cancelled: "bg-red-100 text-red-800",
  };
  return styles[status];
}

const nextStatus: Partial<Record<PrintJob["status"], PrintJob["status"]>> = {
  queued: "printing",
  printing: "ready",
  ready: "collected",
};

export default function QueuePage() {
  const [jobs, setJobs] = useState<PrintJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchQueue = useCallback(async () => {
    try {
      const res = await fetch("/api/queue");
      const data = await res.json();
      if (res.ok) {
        setJobs(data.jobs);
        setLastUpdated(new Date());
      }
    } catch {
      /* ignore transient errors on refresh */
    } finally {
      setLoading(false);
    }
  }, []);

  const updateStatus = async (id: string, status: PrintJob["status"]) => {
    setUpdatingId(id);
    try {
      const res = await fetch("/api/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      if (res.ok) await fetchQueue();
    } finally {
      setUpdatingId(null);
    }
  };

  useEffect(() => {
    fetchQueue();
    const interval = setInterval(fetchQueue, 5000);
    return () => clearInterval(interval);
  }, [fetchQueue]);

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b bg-white sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900">PrintAgent AI</h1>
            <p className="text-xs text-slate-500">Operator Queue Dashboard</p>
          </div>
          <Link
            href="/"
            className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
          >
            ← New Order
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-slate-800">
            Live Print Queue
          </h2>
          {lastUpdated && (
            <p className="text-xs text-slate-400">
              Updated {lastUpdated.toLocaleTimeString()} · refreshes every 5s
            </p>
          )}
        </div>

        {loading ? (
          <div className="text-center py-16 text-slate-400">Loading queue…</div>
        ) : jobs.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border">
            <p className="text-slate-500">No jobs in queue yet.</p>
            <Link
              href="/"
              className="text-indigo-600 text-sm mt-2 inline-block hover:underline"
            >
              Submit a test order →
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-xl border overflow-hidden shadow-sm">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">
                    Student
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">
                    File
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">
                    Spec
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">
                    Urgency
                  </th>
                  <th className="text-right px-4 py-3 font-medium text-slate-600">
                    Cost
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">
                    Status
                  </th>
                  <th className="text-right px-4 py-3 font-medium text-slate-600">Action</th>
                </tr>
              </thead>
              <tbody>
                {jobs.map((job) => (
                  <tr
                    key={job.id}
                    className={`border-b last:border-0 ${
                      job.urgency === "urgent"
                        ? "bg-orange-50 hover:bg-orange-100/60"
                        : "hover:bg-slate-50"
                    }`}
                  >
                    <td className="px-4 py-3 font-medium">{job.studentName}</td>
                    <td className="px-4 py-3 text-slate-600 max-w-[140px] truncate">
                      <div>{job.fileName}</div>
                      <div className="text-xs text-slate-400">{job.machineId ?? "machine pending"}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      <div>{specSummary(job)}</div>
                      <div className="text-xs text-slate-400">{job.printPlan?.summary ?? "Print plan from original order"}</div>
                    </td>
                    <td className="px-4 py-3">
                      {job.urgency === "urgent" ? (
                        <span className="inline-flex items-center gap-1 bg-orange-200 text-orange-900 text-xs font-semibold px-2 py-0.5 rounded-full">
                          ⚡ Urgent
                        </span>
                      ) : (
                        <span className="text-slate-400 text-xs">Standard</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right font-medium">
                      ₹{job.costInRupees.toFixed(2)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${statusBadge(job.status)}`}
                      >
                        {job.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      {nextStatus[job.status] && (
                        <button
                          onClick={() => updateStatus(job.id, nextStatus[job.status]!)}
                          disabled={updatingId === job.id}
                          className="rounded bg-slate-900 px-2 py-1 text-xs font-medium text-white disabled:opacity-50"
                        >
                          {updatingId === job.id ? "Saving..." : nextStatus[job.status]}
                        </button>
                      )}
                      {(job.status === "queued" || job.status === "printing" || job.status === "ready") && (
                        <button
                          onClick={() => updateStatus(job.id, "cancelled")}
                          disabled={updatingId === job.id}
                          className="ml-2 rounded border border-red-200 px-2 py-1 text-xs font-medium text-red-700 disabled:opacity-50"
                        >
                          Cancel
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
