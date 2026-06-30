"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

type AudioWaveformProps = {
  stream: MediaStream | null;
  className?: string;
};

export function AudioWaveform({ stream, className }: AudioWaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);

  useEffect(() => {
    if (!stream || !canvasRef.current) return;

    const audioContext = new AudioContext();
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 64;
    const source = audioContext.createMediaStreamSource(stream);
    source.connect(analyser);

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    const draw = () => {
      animationRef.current = requestAnimationFrame(draw);
      if (!ctx) return;

      analyser.getByteFrequencyData(dataArray);
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const barWidth = (canvas.width / bufferLength) * 0.7;
      const gap = (canvas.width / bufferLength) * 0.3;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const barHeight = (dataArray[i] / 255) * canvas.height * 0.85;
        ctx.fillStyle = "oklch(0.55 0.22 300)";
        ctx.beginPath();
        ctx.roundRect(
          x,
          (canvas.height - barHeight) / 2,
          barWidth,
          Math.max(barHeight, 4),
          2
        );
        ctx.fill();
        x += barWidth + gap;
      }
    };

    draw();

    return () => {
      cancelAnimationFrame(animationRef.current);
      source.disconnect();
      void audioContext.close();
    };
  }, [stream]);

  return (
    <canvas
      ref={canvasRef}
      width={280}
      height={48}
      className={cn("mx-auto", className)}
      aria-hidden
    />
  );
}
