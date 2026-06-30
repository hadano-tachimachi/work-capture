"use client";

import { useCallback, useRef, useState } from "react";
import {
  isSpeechRecognitionSupported,
  MIN_RECORDING_SECONDS,
} from "@/lib/utils/capture-helpers";

function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  const s = Math.floor(seconds % 60)
    .toString()
    .padStart(2, "0");
  return `${m}:${s}`;
}

export function useAudioCapture() {
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const mimeTypeRef = useRef("audio/webm");
  const startTimeRef = useRef(0);
  const streamRef = useRef<MediaStream | null>(null);
  const recognitionRef = useRef<{ stop: () => void } | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [isRecording, setIsRecording] = useState(false);
  const [isStopping, setIsStopping] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [liveTranscript, setLiveTranscript] = useState("");
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState("");
  const [speechSupported] = useState(isSpeechRecognitionSupported);

  const cleanup = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setStream(null);
  }, []);

  const startRecording = useCallback(async () => {
    setError("");
    setLiveTranscript("");
    setElapsed(0);

    try {
      const activeStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });
      streamRef.current = activeStream;
      setStream(activeStream);
      startTimeRef.current = Date.now();

      timerRef.current = setInterval(() => {
        setElapsed(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }, 500);

      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : "audio/webm";
      mimeTypeRef.current = mimeType;

      const recorder = new MediaRecorder(activeStream, { mimeType });
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorderRef.current = recorder;
      recorder.start(250);
      setIsRecording(true);

      if (
        "webkitSpeechRecognition" in window ||
        "SpeechRecognition" in window
      ) {
        const SpeechRecognitionCtor =
          window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRecognitionCtor();
        recognition.lang = "ja-JP";
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.onresult = (event) => {
          let text = "";
          for (let i = 0; i < event.results.length; i++) {
            text += event.results[i][0].transcript;
          }
          setLiveTranscript(text);
        };
        recognition.start();
        recognitionRef.current = recognition;
      }
    } catch {
      cleanup();
      setError("マイクへのアクセスが必要です");
      setIsRecording(false);
    }
  }, [cleanup]);

  const stopRecording = useCallback((): Promise<
    | { blob: Blob; mimeType: string; durationSec: number }
    | { tooShort: true; durationSec: number }
    | null
  > => {
    return new Promise((resolve) => {
      const recorder = mediaRecorderRef.current;
      if (!recorder || recorder.state === "inactive" || isStopping) {
        resolve(null);
        return;
      }

      setIsStopping(true);
      recognitionRef.current?.stop();

      const durationSec = Math.floor(
        (Date.now() - startTimeRef.current) / 1000
      );

      if (durationSec < MIN_RECORDING_SECONDS) {
        recorder.onstop = null;
        recorder.stop();
        cleanup();
        chunksRef.current = [];
        mediaRecorderRef.current = null;
        setIsRecording(false);
        setIsStopping(false);
        setLiveTranscript("");
        setElapsed(0);
        resolve({ tooShort: true, durationSec });
        return;
      }

      recorder.onstop = () => {
        cleanup();
        const blob = new Blob(chunksRef.current, {
          type: mimeTypeRef.current,
        });
        setIsRecording(false);
        setIsStopping(false);
        mediaRecorderRef.current = null;
        resolve({ blob, mimeType: mimeTypeRef.current, durationSec });
      };

      recorder.stop();
    });
  }, [cleanup, isStopping]);

  const cancelRecording = useCallback(() => {
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== "inactive") {
      recorder.onstop = null;
      recorder.stop();
    }
    cleanup();
    chunksRef.current = [];
    mediaRecorderRef.current = null;
    setIsRecording(false);
    setIsStopping(false);
    setLiveTranscript("");
    setElapsed(0);
  }, [cleanup]);

  return {
    isRecording,
    isStopping,
    stream,
    liveTranscript,
    elapsed,
    error,
    formattedDuration: formatDuration(elapsed),
    speechSupported,
    startRecording,
    stopRecording,
    cancelRecording,
  };
}
