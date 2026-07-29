import React, { useEffect, useRef, useState, useCallback } from "react";
import * as pdfjsLib from "pdfjs-dist";
import {
  ZoomIn,
  ZoomOut,
  RotateCw,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Download,
  FileText,
  Loader2,
  RefreshCw
} from "lucide-react";

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

interface PdfViewerProps {
  base64?: string;
  url?: string;
  className?: string;
  isDarkMode?: boolean;
  fileName?: string;
  showToolbar?: boolean;
}

export default function PdfViewer({
  base64,
  url,
  className = "w-full h-[450px]",
  isDarkMode = false,
  fileName = "document.pdf",
  showToolbar = true
}: PdfViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const renderTaskRef = useRef<any>(null);

  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [pageNum, setPageNum] = useState<number>(1);
  const [numPages, setNumPages] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.0);
  const [rotation, setRotation] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Helper to convert base64/dataURL to Uint8Array
  const getPdfData = useCallback(() => {
    if (url) return url;
    if (!base64) return null;
    try {
      let rawBase64 = base64;
      if (base64.includes(",")) {
        rawBase64 = base64.split(",")[1];
      }
      const binaryString = atob(rawBase64);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      return bytes;
    } catch (err) {
      console.error("Failed to parse PDF base64 data:", err);
      return null;
    }
  }, [base64, url]);

  // Load PDF Document
  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    setError(null);

    const loadPdf = async () => {
      const data = getPdfData();
      if (!data) {
        if (isMounted) {
          setError("محتوای فایل PDF نامعتبر است.");
          setIsLoading(false);
        }
        return;
      }

      try {
        const loadingTask = pdfjsLib.getDocument(
          typeof data === "string" ? { url: data } : { data }
        );
        const doc = await loadingTask.promise;

        if (isMounted) {
          setPdfDoc(doc);
          setNumPages(doc.numPages);
          setPageNum(1);
          setIsLoading(false);
        }
      } catch (err: any) {
        console.error("Error loading PDF document:", err);
        if (isMounted) {
          setError("خطا در بارگذاری سند PDF: " + (err.message || "فایل آسیب دیده است."));
          setIsLoading(false);
        }
      }
    };

    loadPdf();

    return () => {
      isMounted = false;
    };
  }, [getPdfData]);

  // Render current page
  const renderPage = useCallback(async () => {
    if (!pdfDoc || !canvasRef.current) return;

    try {
      // Cancel ongoing render task if exists
      if (renderTaskRef.current) {
        renderTaskRef.current.cancel();
        renderTaskRef.current = null;
      }

      const page = await pdfDoc.getPage(pageNum);
      const canvas = canvasRef.current;
      const context = canvas.getContext("2d");

      if (!context) return;

      const viewport = page.getViewport({ scale, rotation });

      canvas.height = viewport.height;
      canvas.width = viewport.width;

      const renderContext = {
        canvasContext: context,
        viewport: viewport
      };

      const renderTask = page.render(renderContext);
      renderTaskRef.current = renderTask;

      await renderTask.promise;
      renderTaskRef.current = null;
    } catch (err: any) {
      if (err.name !== "RenderingCancelledException") {
        console.error("Error rendering PDF page:", err);
      }
    }
  }, [pdfDoc, pageNum, scale, rotation]);

  useEffect(() => {
    renderPage();
  }, [renderPage]);

  // Zoom handlers
  const handleZoomIn = () => {
    setScale((prev) => Math.min(prev + 0.25, 3.0));
  };

  const handleZoomOut = () => {
    setScale((prev) => Math.max(prev - 0.25, 0.4));
  };

  const handleResetZoom = () => {
    setScale(1.0);
    setRotation(0);
  };

  // Rotation handlers
  const handleRotateCw = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const handleRotateCcw = () => {
    setRotation((prev) => (prev - 90 + 360) % 360);
  };

  // Download handler
  const handleDownload = () => {
    const data = getPdfData();
    if (!data) return;

    let downloadUrl: string;
    if (typeof data === "string") {
      downloadUrl = data;
    } else {
      const blob = new Blob([data], { type: "application/pdf" });
      downloadUrl = URL.createObjectURL(blob);
    }

    const a = document.createElement("a");
    a.href = downloadUrl;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div
      ref={containerRef}
      className={`flex flex-col rounded-2xl border overflow-hidden transition-all select-none ${
        isDarkMode
          ? "bg-slate-900/90 border-slate-800 text-slate-100"
          : "bg-white border-slate-200 text-slate-800"
      } ${className}`}
    >
      {/* Interactive Control Toolbar */}
      {showToolbar && (
        <div
          className={`px-3 py-2 border-b flex flex-wrap items-center justify-between gap-2 text-xs font-bold shrink-0 ${
            isDarkMode
              ? "bg-slate-950/80 border-slate-800/80 text-slate-300"
              : "bg-slate-100/90 border-slate-200 text-slate-700"
          }`}
          dir="rtl"
        >
          {/* Zoom controls */}
          <div className="flex items-center gap-1 bg-slate-200/50 dark:bg-slate-800/60 p-1 rounded-xl">
            <button
              type="button"
              onClick={handleZoomIn}
              disabled={scale >= 3.0}
              className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-slate-700 disabled:opacity-40 transition-all cursor-pointer"
              title="بزرگ‌نمایی (+)"
            >
              <ZoomIn className="w-4 h-4 text-blue-500" />
            </button>
            <span className="px-1.5 text-[10px] font-mono font-black min-w-[42px] text-center">
              {Math.round(scale * 100)}%
            </span>
            <button
              type="button"
              onClick={handleZoomOut}
              disabled={scale <= 0.4}
              className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-slate-700 disabled:opacity-40 transition-all cursor-pointer"
              title="کوچک‌نمایی (-)"
            >
              <ZoomOut className="w-4 h-4 text-blue-500" />
            </button>
            <button
              type="button"
              onClick={handleResetZoom}
              className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-slate-700 transition-all cursor-pointer ml-0.5"
              title="بازنشانی اندازه و زاویه"
            >
              <Maximize2 className="w-3.5 h-3.5 text-slate-400" />
            </button>
          </div>

          {/* Rotation controls */}
          <div className="flex items-center gap-1 bg-slate-200/50 dark:bg-slate-800/60 p-1 rounded-xl">
            <button
              type="button"
              onClick={handleRotateCw}
              className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-slate-700 transition-all cursor-pointer flex items-center gap-1"
              title="چرخش ۹۰ درجه راست"
            >
              <RotateCw className="w-4 h-4 text-indigo-500" />
              <span className="text-[9.5px] hidden sm:inline">چرخش راست</span>
            </button>
            <button
              type="button"
              onClick={handleRotateCcw}
              className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-slate-700 transition-all cursor-pointer flex items-center gap-1"
              title="چرخش ۹۰ درجه چپ"
            >
              <RotateCcw className="w-4 h-4 text-indigo-500" />
              <span className="text-[9.5px] hidden sm:inline">چرخش چپ</span>
            </button>
          </div>

          {/* Page navigation controls */}
          {numPages > 1 && (
            <div className="flex items-center gap-1 bg-slate-200/50 dark:bg-slate-800/60 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setPageNum((p) => Math.max(p - 1, 1))}
                disabled={pageNum <= 1}
                className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-slate-700 disabled:opacity-40 transition-all cursor-pointer"
                title="صفحه قبلی"
              >
                <ChevronRight className="w-4 h-4 text-slate-600 dark:text-slate-300" />
              </button>
              <span className="px-2 text-[10.5px]">
                {pageNum} از {numPages}
              </span>
              <button
                type="button"
                onClick={() => setPageNum((p) => Math.min(p + 1, numPages))}
                disabled={pageNum >= numPages}
                className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-slate-700 disabled:opacity-40 transition-all cursor-pointer"
                title="صفحه بعدی"
              >
                <ChevronLeft className="w-4 h-4 text-slate-600 dark:text-slate-300" />
              </button>
            </div>
          )}

          {/* Download button */}
          <button
            type="button"
            onClick={handleDownload}
            className="p-1.5 px-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer shrink-0 shadow-sm"
            title="دانلود فایل PDF"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden xs:inline">دانلود PDF</span>
          </button>
        </div>
      )}

      {/* Main Render Viewport */}
      <div className="flex-1 overflow-auto relative flex items-center justify-center p-4 bg-slate-900/5 dark:bg-slate-950/60 min-h-[200px]">
        {isLoading && (
          <div className="flex flex-col items-center justify-center p-8 text-slate-500">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-2" />
            <span className="text-xs font-bold">در حال بارگذاری و رندر صفحات PDF...</span>
          </div>
        )}

        {error && (
          <div className="flex flex-col items-center justify-center p-6 text-center text-rose-500">
            <FileText className="w-10 h-10 mb-2 opacity-60" />
            <span className="text-xs font-bold">{error}</span>
          </div>
        )}

        <canvas
          ref={canvasRef}
          className={`shadow-lg rounded-md border border-slate-200 dark:border-slate-800 transition-all ${
            isLoading || error ? "hidden" : "block"
          }`}
        />
      </div>
    </div>
  );
}
