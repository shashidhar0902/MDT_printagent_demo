"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";

type Job = {
  id: string;
  studentName: string;
  costInRupees: number;
  upiReference?: string;
  status: string;
};

export default function PaymentPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading payment…</div>}>
      <PaymentPageContent />
    </Suspense>
  );
}

function PaymentPageContent() {
  const params = useSearchParams();
  const router = useRouter();
  const id = params.get("id");

  const [job, setJob] = useState<Job | null>(null);
  const [method, setMethod] = useState("upi");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;
    fetch(`/api/job?id=${encodeURIComponent(id)}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.job) setJob(d.job);
      })
      .catch(() => {});
  }, [id]);

  const handlePay = async () => {
    if (!id) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, method }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Payment failed");
      router.push("/queue");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Payment failed");
    } finally {
      setLoading(false);
    }
  };

  if (!id) {
    return (
      <div className="min-h-screen flex items-center justify-center">Missing payment id</div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <main className="max-w-2xl mx-auto px-4 py-12">
        <div className="bg-white rounded-xl border p-6">
          <h1 className="text-lg font-semibold mb-4">Payment</h1>
          {job ? (
            <div className="space-y-4">
              <div>
                <div className="text-sm text-slate-500">Student</div>
                <div className="font-medium">{job.studentName}</div>
              </div>
              <div>
                <div className="text-sm text-slate-500">Amount</div>
                <div className="font-bold text-xl">₹{job.costInRupees.toFixed(2)}</div>
              </div>
              <div>
                <div className="text-sm text-slate-500">Payment method</div>
                <div className="space-x-3 mt-2">
                  <label className="inline-flex items-center">
                    <input type="radio" name="method" checked={method === "upi"} onChange={() => setMethod("upi")} />
                    <span className="ml-2">UPI</span>
                  </label>
                  <label className="inline-flex items-center">
                    <input type="radio" name="method" checked={method === "debit"} onChange={() => setMethod("debit")} />
                    <span className="ml-2">Debit Card</span>
                  </label>
                  <label className="inline-flex items-center">
                    <input type="radio" name="method" checked={method === "credit"} onChange={() => setMethod("credit")} />
                    <span className="ml-2">Credit Card</span>
                  </label>
                </div>
              </div>

              {error && <div className="text-sm text-red-600">{error}</div>}

              <div className="flex gap-3 mt-4">
                <button onClick={() => router.back()} className="flex-1 border rounded-lg py-2">← Back</button>
                <button onClick={handlePay} disabled={loading} className="flex-1 bg-green-600 text-white rounded-lg py-2">{loading ? "Processing…" : "Pay & Submit"}</button>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-slate-500">Loading job…</div>
          )}
        </div>
      </main>
    </div>
  );
}
