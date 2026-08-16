"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import type { ColorMode, PrintSpec, Urgency } from "@/lib/types";

type Step = "upload" | "review" | "success";

interface PreviewData {
  pageCount: number;
  spec: PrintSpec;
  fileName: string;
}

export default function Home() {
  const [step, setStep] = useState<Step>("upload");
  const [file, setFile] = useState<File | null>(null);
  const [instructions, setInstructions] = useState("");
  const [studentName, setStudentName] = useState("");
  const [preview, setPreview] = useState<PreviewData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successData, setSuccessData] = useState<{
    cost: number;
    upiReference: string;
  } | null>(null);

  const [spec, setSpec] = useState<PrintSpec>({
    copies: 1,
    colorMode: "bw",
    duplex: true,
    urgency: "standard",
  });

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const dropped = e.dataTransfer.files[0];
    if (dropped?.type === "application/pdf" || dropped?.name.endsWith(".pdf")) {
      setFile(dropped);
      setError("");
    } else {
      setError("Please drop a PDF file.");
    }
  }, []);

  const handleGetQuote = async () => {
    if (!file) {
      setError("Please upload a PDF first.");
      return;
    }
    if (!instructions.trim()) {
      setError("Please describe what you need printed.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("instructions", instructions);

      const res = await fetch("/api/parse", { method: "POST", body: formData });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to parse");
      }

      setPreview(data);
      setSpec(data.spec);
      setStep("review");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (!preview || !studentName.trim()) {
      setError("Please enter your name.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentName,
          fileName: preview.fileName,
          pageCount: preview.pageCount,
          ...spec,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to confirm");
      }

      setSuccessData({
        cost: data.costInRupees,
        upiReference: data.upiReference,
      });
      setStep("success");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setStep("upload");
    setFile(null);
    setInstructions("");
    setPreview(null);
    setSuccessData(null);
    setError("");
    setSpec({ copies: 1, colorMode: "bw", duplex: true, urgency: "standard" });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      <header className="border-b bg-white/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900">PrintAgent AI</h1>
            <p className="text-xs text-slate-500">Smart campus print ordering</p>
          </div>
          <Link
            href="/queue"
            className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
          >
            Queue Dashboard →
          </Link>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="space-y-4">
          {/* Chat-style messages */}
          <div className="bg-white rounded-2xl shadow-sm border p-6 space-y-5">
            {step === "upload" && (
              <>
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 text-sm font-bold shrink-0">
                    AI
                  </div>
                  <p className="text-slate-700 pt-1">
                    Hi! Upload your PDF and tell me how you&apos;d like it
                    printed. I&apos;ll parse your instructions and give you a
                    quote.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Your name
                  </label>
                  <input
                    type="text"
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    placeholder="e.g. Gandi"
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div
                  onDrop={handleDrop}
                  onDragOver={(e) => e.preventDefault()}
                  className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center hover:border-indigo-400 transition-colors cursor-pointer"
                  onClick={() =>
                    document.getElementById("file-input")?.click()
                  }
                >
                  <input
                    id="file-input"
                    type="file"
                    accept=".pdf,application/pdf"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) {
                        setFile(f);
                        setError("");
                      }
                    }}
                  />
                  {file ? (
                    <div>
                      <p className="text-indigo-600 font-medium">{file.name}</p>
                      <p className="text-xs text-slate-500 mt-1">
                        {(file.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-slate-600 font-medium">
                        Drop your PDF here
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        or click to browse
                      </p>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Print instructions
                  </label>
                  <textarea
                    value={instructions}
                    onChange={(e) => setInstructions(e.target.value)}
                    placeholder='e.g. "3 copies, back to back, color, need it urgently"'
                    rows={3}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none resize-none"
                  />
                </div>

                <button
                  onClick={handleGetQuote}
                  disabled={loading}
                  className="w-full bg-indigo-600 text-white rounded-lg py-3 font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                >
                  {loading ? "Parsing…" : "Get Quote"}
                </button>
              </>
            )}

            {step === "review" && preview && (
              <>
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 text-sm font-bold shrink-0">
                    AI
                  </div>
                  <p className="text-slate-700 pt-1">
                    I found <strong>{preview.pageCount} pages</strong> in{" "}
                    <strong>{preview.fileName}</strong>. Review the details
                    below and edit anything I got wrong.
                  </p>
                </div>

                <div className="bg-slate-50 rounded-xl p-4 space-y-3 border">
                  <div className="grid grid-cols-2 gap-3">
                    <Field
                      label="Copies"
                      type="number"
                      value={spec.copies}
                      onChange={(v) =>
                        setSpec({ ...spec, copies: Math.max(1, Number(v)) })
                      }
                    />
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">
                        Color
                      </label>
                      <select
                        value={spec.colorMode}
                        onChange={(e) =>
                          setSpec({
                            ...spec,
                            colorMode: e.target.value as ColorMode,
                          })
                        }
                        className="w-full border rounded-lg px-3 py-2 text-sm"
                      >
                        <option value="bw">Black & White</option>
                        <option value="color">Color</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">
                        Sides
                      </label>
                      <select
                        value={spec.duplex ? "duplex" : "single"}
                        onChange={(e) =>
                          setSpec({
                            ...spec,
                            duplex: e.target.value === "duplex",
                          })
                        }
                        className="w-full border rounded-lg px-3 py-2 text-sm"
                      >
                        <option value="duplex">Double-sided</option>
                        <option value="single">Single-sided</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">
                        Urgency
                      </label>
                      <select
                        value={spec.urgency}
                        onChange={(e) =>
                          setSpec({
                            ...spec,
                            urgency: e.target.value as Urgency,
                          })
                        }
                        className="w-full border rounded-lg px-3 py-2 text-sm"
                      >
                        <option value="standard">Standard</option>
                        <option value="urgent">Urgent (+20%)</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setStep("upload")}
                    className="flex-1 border border-slate-300 rounded-lg py-3 text-sm font-medium hover:bg-slate-50"
                  >
                    ← Back
                  </button>
                  <button
                    onClick={handleConfirm}
                    disabled={loading}
                    className="flex-1 bg-green-600 text-white rounded-lg py-3 font-medium hover:bg-green-700 disabled:opacity-50"
                  >
                    {loading ? "Processing…" : "Confirm & Pay (Mock)"}
                  </button>
                </div>
              </>
            )}

            {step === "success" && successData && (
              <>
                <div className="text-center py-4">
                  <div className="text-4xl mb-3">✅</div>
                  <h2 className="text-xl font-bold text-slate-900">
                    Job Queued!
                  </h2>
                  <p className="text-slate-500 mt-1">
                    Your print job has been submitted successfully.
                  </p>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-xl p-5 space-y-3">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Total cost</span>
                    <span className="font-bold text-lg">
                      ₹{successData.cost.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Mock UPI ref</span>
                    <span className="font-mono text-sm font-medium text-green-800">
                      {successData.upiReference}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 pt-2 border-t border-green-200">
                    Mock payment auto-succeeded for demo purposes.
                  </p>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={reset}
                    className="flex-1 border border-slate-300 rounded-lg py-3 text-sm font-medium hover:bg-slate-50"
                  >
                    New Order
                  </button>
                  <Link
                    href="/queue"
                    className="flex-1 bg-indigo-600 text-white rounded-lg py-3 text-sm font-medium hover:bg-indigo-700 text-center"
                  >
                    View Queue
                  </Link>
                </div>
              </>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
                {error}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

function Field({
  label,
  type,
  value,
  onChange,
}: {
  label: string;
  type: string;
  value: number;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-500 mb-1">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border rounded-lg px-3 py-2 text-sm"
      />
    </div>
  );
}
