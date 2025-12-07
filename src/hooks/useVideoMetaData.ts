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
      const el: any = e.currentTarget;
      let title = "";

      try {
        if (el && typeof el.title === "string" && el.title.trim()) {
          title = el.title;
        }

        if (!title && el && el.api && typeof el.api.videoTitle === "string") {
          title = el.api.videoTitle;
        }

        if (!title && el && typeof el.getAttribute === "function") {
          const attr = el.getAttribute("title");
          if (attr && typeof attr === "string") title = attr;
        }
      } catch {}

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
