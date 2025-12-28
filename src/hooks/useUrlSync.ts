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
  /**
   * Manually trigger URL update (useful after specific actions)
   */
  syncToUrl: () => void;
  /**
   * Get the current shareable URL
   */
  getShareableUrl: () => string;
  /**
   * Copy shareable URL to clipboard
   */
  copyShareableUrl: () => Promise<boolean>;
}

/**
 * Hook to synchronize video and notes state with URL hash params.
 *
 * When a user pastes a video URL and adds notes, the URL is updated with:
 * - `v` param: the video URL (encoded)
 * - `n` param: the notes (base64 encoded JSON)
 *
 * When someone opens a shared URL, they can see the video and notes in read-only mode.
 */
export function useUrlSync({
  video,
  notes,
  isFromTimestampUrl,
  debounceMs = 500,
}: UseUrlSyncOptions): UseUrlSyncReturn {
  const updateTimeoutRef = useRef<number | null>(null);
  const lastVideoUrlRef = useRef<string | null>(null);
  const lastNotesLengthRef = useRef<number>(0);

  // Sync state to URL with debouncing
  const syncToUrl = useCallback(() => {
    if (isFromTimestampUrl) {
      // Don't update URL in read-only mode
      return;
    }

    const videoUrl = video?.url ?? null;
    updateUrlHash(videoUrl, notes);
  }, [video?.url, notes, isFromTimestampUrl]);

  // Debounced sync effect
  useEffect(() => {
    if (isFromTimestampUrl) {
      // Don't sync in read-only mode
      return;
    }

    const videoUrl = video?.url ?? null;
    const notesLength = notes.length;

    // Check if anything actually changed
    const videoChanged = videoUrl !== lastVideoUrlRef.current;
    const notesChanged = notesLength !== lastNotesLengthRef.current;

    if (!videoChanged && !notesChanged) {
      return;
    }

    // Update refs
    lastVideoUrlRef.current = videoUrl;
    lastNotesLengthRef.current = notesLength;

    // Clear existing timeout
    if (updateTimeoutRef.current) {
      window.clearTimeout(updateTimeoutRef.current);
      updateTimeoutRef.current = null;
    }

    // If video just loaded, update immediately
    if (videoChanged && videoUrl) {
      syncToUrl();
      return;
    }

    // Debounce notes updates to avoid too many URL changes
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

  // Cleanup on unmount
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

/**
 * Parse notes from current URL hash params
 * This is a convenience export for components that need to read URL state
 */
export function getNotesFromUrl(): Note[] {
  const { notes } = parseHashParams();
  return notes;
}

export default useUrlSync;
