import { useCallback, useEffect, useRef, useState } from "react";
import type { Maybe, Note, Video, VoddingPayload } from "../types";
import { v4 as uuidv4 } from "uuid";

interface UseNotesAutosaveOpts {
  notes: Note[];
  vodding?: Maybe<VoddingPayload>;
  video?: Maybe<Video>;
  save: (payload: VoddingPayload) => Promise<unknown>;
  skipAutosave?: boolean;
  isFromTimestampUrl?: boolean;
  debounceMs?: number;
}

export default function useNotesAutosave({
  notes,
  vodding,
  video,
  save,
  skipAutosave = false,
  isFromTimestampUrl = false,
  debounceMs = 700,
}: UseNotesAutosaveOpts) {
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);

  const autosaveTimer = useRef<number | null>(null);
  const prevNotesRef = useRef<Note[] | null>(null);
  const isRestoringRef = useRef<boolean>(false);
  const restoreClearTimer = useRef<number | null>(null);
  const draftMetaRef = useRef<{ id: string; createdAt: string } | null>(null);

  const doSave = useCallback(async () => {
    try {
      if (!vodding && !video) return;

      const currentVideo = video ?? vodding?.video;
      if (!currentVideo) return;

      if (!vodding && !draftMetaRef.current) {
        draftMetaRef.current = {
          id: uuidv4(),
          createdAt: new Date().toISOString(),
        };
      }

      const payload = vodding
        ? {
            ...vodding,
            video: video ?? vodding.video,
            notes,
            updatedAt: new Date().toISOString(),
          }
        : {
            id: draftMetaRef.current!.id,
            createdAt: draftMetaRef.current!.createdAt,
            updatedAt: new Date().toISOString(),
            video: currentVideo,
            notes,
          };

      await save(payload);
      setLastSavedAt(new Date().toISOString());
    } catch {
      //
    }
  }, [save, vodding, video, notes]);

  useEffect(() => {
    if (skipAutosave) {
      prevNotesRef.current = notes;
      return;
    }
    if (isFromTimestampUrl) {
      prevNotesRef.current = notes;
      return;
    }
    if (isRestoringRef.current) {
      prevNotesRef.current = notes;
      return;
    }
    if (!video && !vodding) {
      prevNotesRef.current = notes;
      return;
    }

    const prev = prevNotesRef.current ?? [];
    const prevLen = prev.length;
    const currLen = notes.length;

    const deleted = currLen < prevLen;
    const edited =
      currLen === prevLen &&
      prevLen > 0 &&
      prev.some((p: Note, i: number) => {
        const next = notes[i];
        return p.id === next.id && p.content !== next.content;
      });

    if (autosaveTimer.current) {
      window.clearTimeout(autosaveTimer.current);
      autosaveTimer.current = null;
    }

    if (edited || deleted) {
      autosaveTimer.current = window.setTimeout(() => {
        void doSave();
      }, 0) as unknown as number;
      prevNotesRef.current = notes;
      return;
    }

    autosaveTimer.current = window.setTimeout(async () => {
      await doSave();
      prevNotesRef.current = notes;
      autosaveTimer.current = null;
    }, debounceMs) as unknown as number;

    return () => {
      if (autosaveTimer.current) {
        window.clearTimeout(autosaveTimer.current);
        autosaveTimer.current = null;
      }
    };
  }, [
    notes,
    doSave,
    video,
    vodding,
    skipAutosave,
    isFromTimestampUrl,
    debounceMs,
  ]);

  useEffect(() => {
    return () => {
      if (autosaveTimer.current) {
        window.clearTimeout(autosaveTimer.current);
        autosaveTimer.current = null;
      }
      if (restoreClearTimer.current) {
        window.clearTimeout(restoreClearTimer.current);
        restoreClearTimer.current = null;
      }
    };
  }, []);

  const onRestoring = useCallback((isRestoring: boolean) => {
    isRestoringRef.current = isRestoring;
    if (isRestoring && autosaveTimer.current) {
      window.clearTimeout(autosaveTimer.current);
      autosaveTimer.current = null;
    }
    if (!isRestoring) {
      if (restoreClearTimer.current) {
        window.clearTimeout(restoreClearTimer.current);
        restoreClearTimer.current = null;
      }
      restoreClearTimer.current = window.setTimeout(() => {
        isRestoringRef.current = false;
        restoreClearTimer.current = null;
      }, 350) as unknown as number;
    }
  }, []);

  return {
    lastSavedAt,
    onRestoring,
    prevNotesRef,
    isRestoringRef,
  };
}
