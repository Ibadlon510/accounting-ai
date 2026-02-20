"use client";

import { useRef, useState } from "react";
import { Camera, X, Upload, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { showError } from "@/lib/utils/toast-helpers";
import { cn } from "@/lib/utils";

interface CameraCaptureProps {
  onCaptured: (file: File) => void;
  className?: string;
}

export function CameraCapture({ onCaptured, className }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [streaming, setStreaming] = useState(false);
  const [captured, setCaptured] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("environment");
  const streamRef = useRef<MediaStream | null>(null);

  async function startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode, width: { ideal: 1920 }, height: { ideal: 1080 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setStreaming(true);
      setCaptured(null);
    } catch {
      showError("Camera unavailable", "Please grant camera permission or use file upload instead.");
    }
  }

  function stopCamera() {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setStreaming(false);
  }

  function capture() {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
    setCaptured(dataUrl);
    stopCamera();
  }

  function switchCamera() {
    stopCamera();
    setFacingMode((m) => (m === "environment" ? "user" : "environment"));
    setTimeout(startCamera, 200);
  }

  function confirmCapture() {
    if (!captured) return;
    fetch(captured)
      .then((r) => r.blob())
      .then((blob) => {
        const file = new File([blob], `scan-${Date.now()}.jpg`, { type: "image/jpeg" });
        onCaptured(file);
        setCaptured(null);
      });
  }

  return (
    <div className={cn("space-y-3", className)}>
      {!streaming && !captured && (
        <button
          type="button"
          onClick={startCamera}
          className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border-subtle bg-surface/50 px-4 py-8 text-[13px] font-medium text-text-secondary transition-all hover:border-[var(--accent-ai)]/40 hover:text-text-primary"
        >
          <Camera className="h-5 w-5" />
          Scan with Camera
        </button>
      )}

      {streaming && (
        <div className="relative overflow-hidden rounded-xl bg-black">
          <video ref={videoRef} className="w-full" autoPlay playsInline muted />
          {/* Edge detection hint overlay */}
          <div className="pointer-events-none absolute inset-8 rounded-xl border-2 border-white/30" />
          <div className="pointer-events-none absolute inset-8 flex items-center justify-center">
            <p className="rounded-lg bg-black/50 px-3 py-1.5 text-[12px] font-medium text-white/80">
              Align document within frame
            </p>
          </div>
          <div className="absolute bottom-4 left-0 right-0 flex items-center justify-center gap-4">
            <button onClick={switchCamera} className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur">
              <RotateCw className="h-4 w-4" />
            </button>
            <button onClick={capture} className="flex h-14 w-14 items-center justify-center rounded-full border-4 border-white bg-white/30 backdrop-blur transition-transform active:scale-90">
              <div className="h-10 w-10 rounded-full bg-white" />
            </button>
            <button onClick={() => { stopCamera(); }} className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {captured && (
        <div className="space-y-2">
          <img src={captured} alt="Captured" className="w-full rounded-xl" />
          <div className="flex gap-2">
            <Button onClick={confirmCapture} className="flex-1 gap-1.5 rounded-xl bg-success text-[13px] font-semibold text-white hover:bg-success/90">
              <Upload className="h-3.5 w-3.5" /> Use this scan
            </Button>
            <Button onClick={startCamera} variant="outline" className="rounded-xl text-[13px]">
              Retake
            </Button>
          </div>
        </div>
      )}

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
