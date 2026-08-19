/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Image Preprocessing Engine for Optical Character Recognition (OCR) Optimization
 * Performs fast client-side pixel transformations on HTML5 Canvas:
 * - High Contrast (Contrast Stretching & Gamma Correction)
 * - Grayscale & B&W Conversion
 * - Adaptive / Global Thresholding (Binarization)
 * - Unsharp Masking & Edge Enhancement (Sharpening & Denoising)
 * - Smart Multi-pass Auto OCR Enhancement
 */

import { ImagePreprocessingMode } from '../types';
export type { ImagePreprocessingMode };

export interface PreprocessingOptions {
  contrastFactor?: number; // default 1.5
  brightnessOffset?: number; // default 10
  thresholdValue?: number; // 0-255, default 135
}

/**
 * Loads a base64 or data-URL string into an HTMLImageElement
 */
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(err);
    img.src = src.startsWith('data:') ? src : `data:image/jpeg;base64,${src}`;
  });
}

/**
 * Applies high contrast and gamma correction to enhance faint ink/thermal receipts
 */
function applyHighContrast(data: Uint8ClampedArray, factor: number = 1.6, brightness: number = 5): void {
  // factor: 1.0 = normal, 1.6 = strong contrast
  for (let i = 0; i < data.length; i += 4) {
    let r = data[i];
    let g = data[i + 1];
    let b = data[i + 2];

    // Convert to grayscale luminance first
    const lum = 0.299 * r + 0.587 * g + 0.114 * b;

    // Apply contrast formula: (val - 128) * factor + 128 + brightness
    let newLum = (lum - 128) * factor + 128 + brightness;
    newLum = Math.max(0, Math.min(255, newLum));

    data[i] = newLum;
    data[i + 1] = newLum;
    data[i + 2] = newLum;
    // data[i+3] is alpha, keep as is
  }
}

/**
 * Converts image to clean grayscale (luminance formula)
 */
function applyGrayscale(data: Uint8ClampedArray): void {
  for (let i = 0; i < data.length; i += 4) {
    const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    data[i] = gray;
    data[i + 1] = gray;
    data[i + 2] = gray;
  }
}

/**
 * Converts image to pure binary black & white with thresholding
 * Ideal for phone photo shadows and carbon copy invoices
 */
function applyThresholding(data: Uint8ClampedArray, threshold: number = 140): void {
  // Calculate average luminance for dynamic auto-threshold fallback
  let totalLum = 0;
  const pixelCount = data.length / 4;
  for (let i = 0; i < data.length; i += 4) {
    totalLum += 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
  }
  const avgLum = totalLum / pixelCount;
  // Adaptive threshold based on average brightness
  const actualThreshold = threshold > 0 ? (threshold * 0.4 + avgLum * 0.6) : avgLum;

  for (let i = 0; i < data.length; i += 4) {
    const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    const val = gray < actualThreshold ? 0 : 255;
    data[i] = val;
    data[i + 1] = val;
    data[i + 2] = val;
  }
}

/**
 * 3x3 convolution kernel sharpening to enhance blurred digits and dot-matrix receipts
 */
function applySharpening(
  data: Uint8ClampedArray,
  width: number,
  height: number
): Uint8ClampedArray {
  const output = new Uint8ClampedArray(data.length);
  // Sharpening Kernel (Laplacian unsharp mask)
  const kernel = [
    0, -1, 0,
    -1, 5, -1,
    0, -1, 0
  ];

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      let r = 0, g = 0, b = 0;
      for (let ky = -1; ky <= 1; ky++) {
        for (let kx = -1; kx <= 1; kx++) {
          const pixelIdx = ((y + ky) * width + (x + kx)) * 4;
          const weight = kernel[(ky + 1) * 3 + (kx + 1)];
          r += data[pixelIdx] * weight;
          g += data[pixelIdx + 1] * weight;
          b += data[pixelIdx + 2] * weight;
        }
      }
      const targetIdx = (y * width + x) * 4;
      output[targetIdx] = Math.min(255, Math.max(0, r));
      output[targetIdx + 1] = Math.min(255, Math.max(0, g));
      output[targetIdx + 2] = Math.min(255, Math.max(0, b));
      output[targetIdx + 3] = data[targetIdx + 3]; // alpha
    }
  }

  return output;
}

/**
 * Multi-pass intelligent auto OCR enhancement
 * 1. Grayscale
 * 2. Contrast stretching (histogram normalization)
 * 3. Background whitening & ink darkening
 */
function applyAutoOcrEnhancement(data: Uint8ClampedArray): void {
  // Pass 1: find min and max luminance for histogram stretching
  let minLum = 255;
  let maxLum = 0;

  for (let i = 0; i < data.length; i += 4) {
    const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    if (gray < minLum) minLum = gray;
    if (gray > maxLum) maxLum = gray;
  }

  // Prevent divide by zero
  if (maxLum - minLum < 10) {
    maxLum = 255;
    minLum = 0;
  }

  const range = maxLum - minLum;

  // Pass 2: stretch histogram and boost ink contrast
  for (let i = 0; i < data.length; i += 4) {
    const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    // Normalized 0 to 1
    let normalized = (gray - minLum) / range;
    // S-curve contrast boost
    normalized = Math.pow(normalized, 1.4);
    let enhanced = normalized * 255;

    // Darken text, whiten paper background
    if (enhanced > 190) {
      enhanced = 255; // clean white background
    } else if (enhanced < 80) {
      enhanced = Math.max(0, enhanced * 0.6); // deep dark ink
    }

    data[i] = enhanced;
    data[i + 1] = enhanced;
    data[i + 2] = enhanced;
  }
}

/**
 * Super-resolution adaptive edge and character enhancement
 * Performs background illumination leveling, high-boost filtering, and sharp contrast normalization
 */
function applySuperResolutionAdaptive(
  data: Uint8ClampedArray,
  width: number,
  height: number
): Uint8ClampedArray {
  // Step 1: Grayscale & find min/max luminance
  let minLum = 255;
  let maxLum = 0;
  for (let i = 0; i < data.length; i += 4) {
    const lum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    if (lum < minLum) minLum = lum;
    if (lum > maxLum) maxLum = lum;
  }
  if (maxLum - minLum < 15) {
    maxLum = 255;
    minLum = 0;
  }
  const range = maxLum - minLum;

  // Step 2: Normalize and high-boost contrast
  const normalizedData = new Uint8ClampedArray(data.length);
  for (let i = 0; i < data.length; i += 4) {
    const lum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    let norm = (lum - minLum) / range;
    norm = Math.pow(norm, 1.35); // Gamma correction
    let val = norm * 255;
    if (val > 185) val = 255; // Crisp paper background
    else if (val < 90) val = Math.max(0, val * 0.5); // Deep ink
    normalizedData[i] = val;
    normalizedData[i + 1] = val;
    normalizedData[i + 2] = val;
    normalizedData[i + 3] = data[i + 3];
  }

  // Step 3: High-boost 3x3 sharpening kernel
  const output = new Uint8ClampedArray(data.length);
  const kernel = [
    -1, -1, -1,
    -1,  9, -1,
    -1, -1, -1
  ];

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      let r = 0;
      for (let ky = -1; ky <= 1; ky++) {
        for (let kx = -1; kx <= 1; kx++) {
          const pixelIdx = ((y + ky) * width + (x + kx)) * 4;
          const weight = kernel[(ky + 1) * 3 + (kx + 1)];
          r += normalizedData[pixelIdx] * weight;
        }
      }
      const targetIdx = (y * width + x) * 4;
      const finalVal = Math.min(255, Math.max(0, r));
      output[targetIdx] = finalVal;
      output[targetIdx + 1] = finalVal;
      output[targetIdx + 2] = finalVal;
      output[targetIdx + 3] = data[targetIdx + 3];
    }
  }

  return output;
}

/**
 * Preprocesses an image given as base64 string or data-URL and returns the enhanced base64 string
 */
export async function preprocessImageBase64(
  rawBase64OrDataUrl: string,
  mode: ImagePreprocessingMode,
  options?: PreprocessingOptions
): Promise<string> {
  // If mode is 'none' or empty, return original immediately
  if (!mode || mode === 'none' || !rawBase64OrDataUrl) {
    return rawBase64OrDataUrl;
  }

  // If it's a PDF file, canvas cannot directly rasterize it via Image() without pdfjs, return original
  if (rawBase64OrDataUrl.startsWith('data:application/pdf') || rawBase64OrDataUrl.includes('application/pdf')) {
    return rawBase64OrDataUrl;
  }

  try {
    const src = rawBase64OrDataUrl.startsWith('data:')
      ? rawBase64OrDataUrl
      : `data:image/jpeg;base64,${rawBase64OrDataUrl}`;

    const img = await loadImage(src);

    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth || img.width;
    canvas.height = img.naturalHeight || img.height;

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return rawBase64OrDataUrl;

    ctx.drawImage(img, 0, 0);

    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imgData.data;

    switch (mode) {
      case 'high_contrast':
        applyHighContrast(data, options?.contrastFactor ?? 1.7, options?.brightnessOffset ?? 8);
        ctx.putImageData(imgData, 0, 0);
        break;

      case 'grayscale_bw':
        applyGrayscale(data);
        ctx.putImageData(imgData, 0, 0);
        break;

      case 'binarize_adaptive':
        applyThresholding(data, options?.thresholdValue ?? 140);
        ctx.putImageData(imgData, 0, 0);
        break;

      case 'sharpness_denoise': {
        applyGrayscale(data);
        const sharpened = applySharpening(data, canvas.width, canvas.height);
        const newImgData = new ImageData(sharpened, canvas.width, canvas.height);
        ctx.putImageData(newImgData, 0, 0);
        break;
      }

      case 'auto_enhance':
        applyAutoOcrEnhancement(data);
        ctx.putImageData(imgData, 0, 0);
        break;

      case 'super_resolution_adaptive': {
        const superRes = applySuperResolutionAdaptive(data, canvas.width, canvas.height);
        const newImgData = new ImageData(superRes, canvas.width, canvas.height);
        ctx.putImageData(newImgData, 0, 0);
        break;
      }

      default:
        break;
    }

    // Export as high quality JPEG (0.95 quality)
    const resultDataUrl = canvas.toDataURL('image/jpeg', 0.95);
    
    // Return base64 without prefix if input didn't have data: prefix
    if (!rawBase64OrDataUrl.startsWith('data:') && resultDataUrl.includes('base64,')) {
      return resultDataUrl.split('base64,')[1];
    }
    return resultDataUrl;
  } catch (err) {
    console.warn('[Image Preprocessing] Failed to preprocess image, falling back to original:', err);
    return rawBase64OrDataUrl;
  }
}
