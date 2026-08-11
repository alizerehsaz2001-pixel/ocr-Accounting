/**
 * Fast Hardware-Accelerated Image Pre-processing for ZerehScan OCR Engine
 * Uses browser native Canvas filters with fallback timeout to prevent UI freezes.
 */

export interface EnhancementOptions {
  contrast?: number; // percentage boost e.g. 20 => 120%
  brightness?: number; // percentage boost e.g. 5 => 105%
  sharpness?: boolean;
  grayscale?: boolean;
  autoBinarization?: boolean;
}

/**
 * Rapidly enhances base64 image data using native Canvas CSS filter pipeline.
 */
export async function enhanceImageBase64(
  base64Data: string,
  mimeType: string = "image/jpeg",
  options: EnhancementOptions = {}
): Promise<string> {
  const {
    contrast = 20,
    brightness = 5,
    grayscale = false,
  } = options;

  // Skip PDF or missing image payload
  if (!base64Data || mimeType.includes("pdf")) {
    return base64Data;
  }

  return new Promise((resolve) => {
    // Safety net: Auto-fallback after 800ms to guarantee processing never hangs
    const timer = setTimeout(() => {
      resolve(base64Data);
    }, 800);

    try {
      const img = new Image();
      const dataUri = base64Data.startsWith("data:") ? base64Data : `data:${mimeType};base64,${base64Data}`;

      img.onload = () => {
        clearTimeout(timer);
        try {
          const canvas = document.createElement("canvas");
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext("2d");

          if (!ctx) {
            resolve(base64Data);
            return;
          }

          // Build hardware-accelerated filter string
          const contrastVal = 100 + contrast;
          const brightnessVal = 100 + brightness;
          const filterParts: string[] = [
            `contrast(${contrastVal}%)`,
            `brightness(${brightnessVal}%)`
          ];
          if (grayscale) {
            filterParts.push("grayscale(100%)");
          }

          ctx.filter = filterParts.join(" ");
          ctx.drawImage(img, 0, 0, img.width, img.height);

          const enhancedDataUrl = canvas.toDataURL(mimeType.includes("png") ? "image/png" : "image/jpeg", 0.90);
          const resultBase64 = enhancedDataUrl.split(",")[1] || base64Data;
          resolve(resultBase64);
        } catch (e) {
          console.warn("Fast canvas filter fallback:", e);
          resolve(base64Data);
        }
      };

      img.onerror = () => {
        clearTimeout(timer);
        resolve(base64Data);
      };

      img.src = dataUri;
    } catch (e) {
      clearTimeout(timer);
      resolve(base64Data);
    }
  });
}

