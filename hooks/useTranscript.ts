"use client";

import { useEffect, useState } from "react";
import type { Transcript } from "@/lib/types";
import { fetchTranscript } from "@/lib/mockApi";

export function useTranscript() {
  const [transcript, setTranscript] = useState<Transcript | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetchTranscript().then((data) => {
      if (!cancelled) {
        setTranscript(data);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return { transcript, loading };
}
