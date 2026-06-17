/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState, useEffect } from "react";
import { Camera, RefreshCw, X, Check } from "lucide-react";

interface CameraCaptureProps {
  onCapture: (base64Image: string) => void;
  onClose: () => void;
}

export default function CameraCapture({ onCapture, onClose }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  // Initialize camera access
  const startCamera = async (deviceId?: string) => {
    try {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
      setError(null);

      const constraints: MediaStreamConstraints = {
        video: deviceId
          ? { deviceId: { exact: deviceId } }
          : { facingMode: "environment" }, // Prefer back camera on mobile
        audio: false,
      };

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }

      // Enumerate available devices for switching
      const allDevices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = allDevices.filter((d) => d.kind === "videoinput");
      setDevices(videoDevices);
    } catch (err: any) {
      console.error("Camera access error:", err);
      setError(
        "امکان دسترسی به دوربین وجود ندارد. لطفا مطمئن شوید که دسترسی به دوربین را تایید کرده‌اید و دستگاه دیگری در حال استفاده از آن نیست."
      );
    }
  };

  useEffect(() => {
    startCamera();
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const handleDeviceChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const deviceId = event.target.value;
    setSelectedDeviceId(deviceId);
    startCamera(deviceId);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext("2d");

      if (context) {
        // Match dimensions of the video stream
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        // Mirror if front facing
        if (devices.find(d => d.deviceId === selectedDeviceId)?.label.toLowerCase().includes("front")) {
          context.translate(canvas.width, 0);
          context.scale(-1, 1);
        }

        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        const base64 = canvas.toDataURL("image/jpeg", 0.9);
        setCapturedImage(base64);
        
        // Stop stream briefly to save resources
        if (stream) {
          stream.getTracks().forEach((track) => track.stop());
        }
      }
    }
  };

  const retakePhoto = () => {
    setCapturedImage(null);
    startCamera(selectedDeviceId);
  };

  const confirmPhoto = () => {
    if (capturedImage) {
      onCapture(capturedImage);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 font-sans" dir="rtl">
      <div className="relative w-full max-w-2xl overflow-hidden rounded-2xl bg-zinc-900 border border-zinc-800 text-white shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 px-6 py-4">
          <div className="flex items-center gap-2">
            <Camera className="h-5 w-5 text-emerald-500" />
            <span className="font-semibold text-lg text-emerald-100">اسکن مستقیم با دوربین</span>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="relative flex-1 bg-black min-h-[350px] flex items-center justify-center">
          {error ? (
            <div className="p-6 text-center text-rose-400 max-w-md mx-auto">
              <p className="text-sm font-medium leading-relaxed">{error}</p>
              <button
                onClick={() => startCamera(selectedDeviceId)}
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-zinc-800 px-4 py-2 text-sm text-white hover:bg-zinc-700 transition"
              >
                <RefreshCw className="h-4 w-4" />
                تلاش مجدد
              </button>
            </div>
          ) : !capturedImage ? (
            <div className="relative w-full h-full flex flex-col items-center">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full max-h-[480px] object-cover"
              />
              {/* Target guidelines overlay for invoices/ledgers */}
              <div className="absolute inset-x-8 inset-y-12 border-2 border-dashed border-emerald-500/50 rounded-xl pointer-events-none flex items-center justify-center">
                <span className="text-xs bg-black/60 text-emerald-400 px-3 py-1 rounded-full backdrop-blur-sm">
                  مدرک حسابداری یا فاکتور را در این کادر قرار دهید
                </span>
              </div>
            </div>
          ) : (
            <img
              src={capturedImage}
              alt="صید شده"
              className="w-full max-h-[480px] object-contain"
            />
          )}
        </div>

        {/* Hidden canvas */}
        <canvas ref={canvasRef} className="hidden" />

        {/* Footer controls */}
        <div className="bg-zinc-950 px-6 py-4 border-t border-zinc-900 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="w-full md:w-auto">
            {devices.length > 1 && !capturedImage && (
              <div className="flex items-center gap-2 text-xs text-zinc-400">
                <span>دوربین جاری:</span>
                <select
                  value={selectedDeviceId}
                  onChange={handleDeviceChange}
                  className="rounded-lg border border-zinc-800 bg-zinc-900 px-2 py-1 text-white text-xs outline-none focus:border-emerald-500"
                >
                  {devices.map((device, idx) => (
                    <option key={device.deviceId} value={device.deviceId}>
                      {device.label || `دوربین ${idx + 1}`}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="flex gap-3 justify-end w-full md:w-auto">
            {!capturedImage ? (
              <button
                type="button"
                onClick={capturePhoto}
                className="w-full md:w-auto gap-2 inline-flex items-center justify-center rounded-xl bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500 active:scale-95 transition-all shadow-lg shadow-emerald-950/20"
              >
                <Camera className="h-4 w-4" />
                ثبت تصویر و استخراج
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={retakePhoto}
                  className="gap-2 inline-flex items-center justify-center rounded-xl bg-zinc-800 px-5 py-2.5 text-sm font-semibold text-zinc-200 hover:bg-zinc-700 active:scale-95 transition"
                >
                  <RefreshCw className="h-4 w-4" />
                  تصویربرداری مجدد
                </button>
                <button
                  type="button"
                  onClick={confirmPhoto}
                  className="gap-2 inline-flex items-center justify-center rounded-xl bg-emerald-500 px-6 py-2.5 text-sm font-semibold text-neutral-950 hover:bg-emerald-400 active:scale-95 transition-all font-bold"
                >
                  <Check className="h-4 w-4" />
                  تایید و استخراج داده
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
