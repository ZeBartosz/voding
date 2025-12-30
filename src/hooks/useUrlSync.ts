import { useCallback, useEffect, useRef } from "react";
import type { Note, Video } from "../types";
import { updateUrlHash, encodeNotesForUrl, parseHashParams } from "../utils/urlParams";

interface UseUrlSyncOptions {
  video: Video | null;
  notes: Note[];
  isFromTimestampUrl: boolean;
  onLoadFromUrl?: (videoUrl: string, notes: Note[]) => void;
  debounceMs?: number;
}

interface UseUrlSyncReturn {
  syncToUrl: () => void;
  getShareableUrl: () => string;
  copyShareableUrl: () => Promise<boolean>;
}

export function useUrlSync({
  video,
  notes,
  isFromTimestampUrl,
  debounceMs = 500,
}: UseUrlSyncOptions): UseUrlSyncReturn {
  const updateTimeoutRef = useRef<number | null>(null);
  const lastVideoUrlRef = useRef<string | null>(null);
  const lastNotesHashRef = useRef<string>("");

  const getNotesHash = (notes: Note[]) => {
    return JSON.stringify(notes.map((n) => ({ t: n.timestamp, c: n.content })));
  };

  const syncToUrl = useCallback(() => {
    if (isFromTimestampUrl) {
      return;
    }

    const videoUrl = video?.url ?? null;
    updateUrlHash(videoUrl, notes);
  }, [video?.url, notes, isFromTimestampUrl]);

  useEffect(() => {
    if (isFromTimestampUrl) {
      return;
    }

    const videoUrl = video?.url ?? null;
    const notesHash = getNotesHash(notes);

    const videoChanged = videoUrl !== lastVideoUrlRef.current;
    const notesChanged = notesHash !== lastNotesHashRef.current;

    if (!videoChanged && !notesChanged) {
      return;
    }

    lastVideoUrlRef.current = videoUrl;
    lastNotesHashRef.current = notesHash;

    if (updateTimeoutRef.current) {
      window.clearTimeout(updateTimeoutRef.current);
      updateTimeoutRef.current = null;
    }

    if (videoChanged && videoUrl) {
      syncToUrl();
      return;
    }

    updateTimeoutRef.current = window.setTimeout(() => {
      syncToUrl();
      updateTimeoutRef.current = null;
    }, debounceMs) as unknown as number;

    return () => {
      if (updateTimeoutRef.current) {
        window.clearTimeout(updateTimeoutRef.current);
        updateTimeoutRef.current = null;
      }
    };
  }, [video?.url, notes, isFromTimestampUrl, debounceMs, syncToUrl]);

  useEffect(() => {
    return () => {
      if (updateTimeoutRef.current) {
        window.clearTimeout(updateTimeoutRef.current);
        updateTimeoutRef.current = null;
      }
    };
  }, []);

  const getShareableUrl = useCallback((): string => {
    const videoUrl = video?.url ?? null;
    if (!videoUrl) {
      return window.location.origin + window.location.pathname;
    }

    const { origin, pathname } = window.location;
    const params = new URLSearchParams();

    params.set("v", encodeURIComponent(videoUrl));

    if (notes.length > 0) {
      const encodedNotes = encodeNotesForUrl(notes);
      if (encodedNotes) {
        params.set("n", encodedNotes);
      }
    }

    return `${origin}${pathname}#${params.toString()}`;
  }, [video?.url, notes]);

  const copyShareableUrl = useCallback(async (): Promise<boolean> => {
    try {
      const url = getShareableUrl();
      await navigator.clipboard.writeText(url);
      return true;
    } catch {
      return false;
    }
  }, [getShareableUrl]);

  return {
    syncToUrl,
    getShareableUrl,
    copyShareableUrl,
  };
}

export function getNotesFromUrl(): Note[] {
  const { notes } = parseHashParams();
  return notes;
}

export default useUrlSync;
