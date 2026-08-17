import { NextRequest, NextResponse } from "next/server";
import { PDFDocument } from "pdf-lib";
import { extractPrintSpec } from "@/lib/anthropic";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const uploadedFiles = [
      ...formData.getAll("files"),
      formData.get("file"),
    ].filter((value): value is File => value instanceof File);
    const instructions = (formData.get("instructions") as string) || "";

    if (uploadedFiles.length === 0) {
      return NextResponse.json({ error: "PDF file is required" }, { status: 400 });
    }

    const files: Array<{ fileName: string; pageCount: number }> = [];

    for (const file of uploadedFiles) {
      if (file.type !== "application/pdf" && !file.name.endsWith(".pdf")) {
        return NextResponse.json(
          { error: "Please upload PDF files only" },
          { status: 400 },
        );
      }

      const bytes = await file.arrayBuffer();
      let filePageCount: number;

      try {
        const pdf = await PDFDocument.load(bytes);
        filePageCount = pdf.getPageCount();
      } catch {
        return NextResponse.json(
          {
            error: `Could not read ${file.name}. Make sure the file is not corrupted.`,
          },
          { status: 400 },
        );
      }

      files.push({ fileName: file.name, pageCount: filePageCount });
    }

    const pageCount = files.reduce((total, current) => total + current.pageCount, 0);

    const spec = await extractPrintSpec(instructions);

    return NextResponse.json({
      pageCount,
      spec,
      fileName:
        files.length === 1 ? files[0].fileName : `${files.length} files uploaded`,
      fileCount: files.length,
      files,
    });
  } catch (error) {
    console.error("Parse error:", error);
    return NextResponse.json(
      {
        error:
          "Failed to parse instructions. Try rephrasing or edit the fields manually.",
      },
      { status: 500 },
    );
  }
}
