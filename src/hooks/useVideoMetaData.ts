import { useCallback, useRef, useState } from "react";

export const useVideoMetaData = () => {
  const currentTimeRef = useRef(0);
  const [currentTitle, setCurrentTitle] = useState<string | null>(null);

  const handleProgress = useCallback(
    (e: React.SyntheticEvent<HTMLMediaElement>) => {
      const el = e.currentTarget as HTMLMediaElement;
      currentTimeRef.current = el.currentTime;
      setCurrentTitle(el.title);
    },
    [],
  );

  const handleTitleChange = useCallback(
    (e: React.SyntheticEvent<HTMLMediaElement>) => {
      const el = e.currentTarget as HTMLMediaElement;
      let title = "";

      try {
        if (typeof el.title === "string" && el.title.trim()) {
          title = el.title;
        }

        if (!title) {
          const maybeApi = (el as unknown as { api?: unknown }).api;
          if (typeof maybeApi === "object" && maybeApi !== null) {
            const api = maybeApi as { videoTitle?: unknown };
            if (typeof api.videoTitle === "string") {
              title = api.videoTitle;
            }
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
    },
    [],
  );

  return {
    currentTimeRef,
    currentTitle,
    handleTitleChange,
    handleProgress,
    setCurrentTitle,
  };
};
