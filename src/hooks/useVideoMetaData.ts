import { useCallback, useRef, useState } from "react";
import type { ReactPlayerProgress } from "../types/player";

export const useVideoMetaData = () => {
  const currentTimeRef = useRef<number>(0);
  const [currentTitle, setCurrentTitle] = useState<string | null>(null);

  const handleProgress = useCallback(
    (e: React.SyntheticEvent<HTMLMediaElement> | ReactPlayerProgress) => {
      if ("playedSeconds" in e) {
        currentTimeRef.current = e.playedSeconds ?? 0;
      } else {
        const event = e;
        const el = event.currentTarget;
        currentTimeRef.current = el.currentTime;
        setCurrentTitle(el.title);
      }
    },
    [],
  );

  const handleTitleChange = useCallback((e: React.SyntheticEvent<HTMLMediaElement>) => {
    const el = e.currentTarget as HTMLMediaElement;
    let title = "";

    try {
      if (typeof el.title === "string" && el.title.trim()) {
        title = el.title;
      }

      if (!title) {
        const maybeApi = (el as { api?: { videoTitle?: string } }).api;
        if (maybeApi && typeof maybeApi.videoTitle === "string") {
          title = maybeApi.videoTitle;
        }
      }

      if (!title && typeof el.getAttribute === "function") {
        const attr = el.getAttribute("title");
        if (attr && typeof attr === "string") title = attr;
      }
    } catch {
      //
    }

    setCurrentTitle(title);
  }, []);

  return {
    currentTimeRef,
    currentTitle,
    handleTitleChange,
    handleProgress,
    setCurrentTitle,
  };
};
