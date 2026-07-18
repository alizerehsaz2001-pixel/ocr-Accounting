import React, { useEffect, useRef, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { FileText } from 'lucide-react';

pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

interface PdfThumbnailProps {
  base64: string;
  className?: string;
  isDarkMode?: boolean;
}

export default function PdfThumbnail({ base64, className = "w-5 h-5", isDarkMode = false }: PdfThumbnailProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let isMounted = true;
    
    const renderPdf = async () => {
      if (!base64) return;
      
      try {
        const pdfData = atob(base64);
        const uint8Array = new Uint8Array(pdfData.length);
        for (let i = 0; i < pdfData.length; i++) {
          uint8Array[i] = pdfData.charCodeAt(i);
        }

        const loadingTask = pdfjsLib.getDocument({ data: uint8Array });
        const pdf = await loadingTask.promise;
        
        if (!isMounted) return;
        
        const page = await pdf.getPage(1);
        if (!isMounted) return;
        
        const scale = 0.5; // Small scale for thumbnail
        const viewport = page.getViewport({ scale });
        
        const canvas = canvasRef.current;
        if (!canvas) return;
        
        const context = canvas.getContext('2d');
        if (!context) return;
        
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        const renderContext = {
          canvasContext: context,
          viewport: viewport,
        };

        // @ts-ignore
        await page.render(renderContext).promise;
        if (isMounted) {
          setLoaded(true);
        }
      } catch (err) {
        console.error("Error rendering PDF thumbnail:", err);
        if (isMounted) setError(true);
      }
    };

    renderPdf();

    return () => {
      isMounted = false;
    };
  }, [base64]);

  return (
    <div className={`relative flex items-center justify-center overflow-hidden bg-white ${className}`}>
      {(!loaded || error) && (
        <FileText className={`w-3/4 h-3/4 text-rose-500 absolute`} />
      )}
      <canvas
        ref={canvasRef}
        className={`w-full h-full object-cover transition-opacity duration-300 ${loaded && !error ? 'opacity-100' : 'opacity-0'}`}
      />
    </div>
  );
}
