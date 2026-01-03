import { useCallback, useEffect, useRef, useState } from "react";
import type { Maybe, Note, Video, VoddingPayload } from "../types";
import { v4 as uuidv4 } from "uuid";

interface UseNotesAutosaveOpts {
  notes: Note[];
  vodding?: Maybe<VoddingPayload>;
  video?: Maybe<Video>;
  save: (payload: VoddingPayload) => Promise<unknown>;
  skipAutosave?: boolean;
  sharedFromUrl: boolean;
}

export default function useNotesAutosave({
  notes,
  vodding,
  video,
  save,
  skipAutosave = false,
  sharedFromUrl,
}: UseNotesAutosaveOpts) {
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);

  const autosaveTimer = useRef<number | null>(null);
  const prevNotesRef = useRef<Note[] | null>(null);
  const isRestoringRef = useRef<boolean>(false);
  const restoreClearTimer = useRef<number | null>(null);
  const draftMetaRef = useRef<{ id: string; createdAt: string } | null>(null);
  const prevSharedFromUrlRef = useRef(sharedFromUrl);

  const doSave = useCallback(async () => {
    try {
      if (!vodding && !video) return;

      const currentVideo = video ?? vodding?.video;
      if (!currentVideo) return;

      const now = new Date().toISOString();

      if (!vodding && !draftMetaRef.current) {
        draftMetaRef.current = { id: uuidv4(), createdAt: now };
      }

      if (!vodding) {
        const draftMeta = draftMetaRef.current;
        if (!draftMeta) return;

        const payload = {
          id: draftMeta.id,
          createdAt: draftMeta.createdAt,
          updatedAt: now,
          video: currentVideo,
          notes,
        };

        await save(payload);
        setLastSavedAt(now);
        return;
      }

      const payload = {
        ...vodding,
        video: video ?? vodding.video,
        notes,
        updatedAt: now,
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
    if (sharedFromUrl) {
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
    const added = currLen > prevLen;
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

    if (deleted || edited || added) {
      autosaveTimer.current = window.setTimeout(() => {
        void doSave();
      }, 0);
      prevNotesRef.current = notes;
      return;
    }

    return () => {
      if (autosaveTimer.current) {
        window.clearTimeout(autosaveTimer.current);
        autosaveTimer.current = null;
      }
    };
  }, [notes, video, vodding, skipAutosave, doSave, sharedFromUrl]);

  useEffect(() => {
    const wasShared = prevSharedFromUrlRef.current;
    prevSharedFromUrlRef.current = sharedFromUrl;

    if (
      wasShared &&
      !sharedFromUrl &&
      !skipAutosave &&
      !isRestoringRef.current &&
      (video || vodding)
    ) {
      if (autosaveTimer.current) {
        window.clearTimeout(autosaveTimer.current);
        autosaveTimer.current = null;
      }

      autosaveTimer.current = window.setTimeout(() => {
        void doSave();
      }, 0);

      prevNotesRef.current = notes;
    }
  }, [sharedFromUrl, skipAutosave, video, vodding, doSave, notes]);

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
      }, 350);
    }
  }, []);

  return {
    lastSavedAt,
    onRestoring,
    prevNotesRef,
    isRestoringRef,
  };
}
