"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { isSpeechRecognitionSupported } from "@/lib/utils/capture-helpers";

export function useSpeechDictation() {
  const recognitionRef = useRef<{ stop: () => void } | null>(null);
  const baseRef = useRef("");
  const [listening, setListening] = useState(false);
  const [supported] = useState(isSpeechRecognitionSupported);

  const stop = useCallback(() => {
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    setListening(false);
  }, []);

  const toggle = useCallback(
    (currentValue: string, onChange: (value: string) => void) => {
      if (!supported) return;

      if (listening) {
        stop();
        return;
      }

      const Ctor =
        window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new Ctor();
      recognition.lang = "ja-JP";
      recognition.continuous = true;
      recognition.interimResults = true;

      baseRef.current = currentValue;

      recognition.onresult = (event) => {
        let sessionText = "";
        for (let i = 0; i < event.results.length; i++) {
          sessionText += event.results[i][0].transcript;
        }
        const base = baseRef.current;
        const spacer =
          base && sessionText && !base.endsWith(" ") && !base.endsWith("\n")
            ? " "
            : "";
        onChange(base + spacer + sessionText);
      };

      recognition.onerror = () => stop();
      recognition.onend = () => {
        recognitionRef.current = null;
        setListening(false);
      };

      recognition.start();
      recognitionRef.current = recognition;
      setListening(true);
    },
    [listening, supported, stop]
  );

  useEffect(() => () => stop(), [stop]);

  return { listening, supported, toggle, stop };
}
