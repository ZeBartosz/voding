import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";
import type { Video } from "../types";
import { v4 as uuidv4 } from "uuid";

export const useLink = (
  currentTitle: string | null,
  setIsFromTimestampUrl: Dispatch<SetStateAction<boolean>>,
) => {
  const [video, setVideo] = useState<Video | null>(null);
  const [inputValue, setInputValue] = useState<string>("");
  const [error, setError] = useState<string>("");
  const jumpTimeoutRef = useRef<number | null>(null);
  const playerRef = useRef<HTMLVideoElement | null>(null);
  const [focus, setFocus] = useState({ x: 0.5, y: 0.5 });
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const internal = playerRef.current;
    if (!internal) return;

    const el: HTMLElement = internal.nodeName ? internal : internal;

    el.style.transformOrigin = `${(focus.x * 100).toFixed()}% ${(focus.y * 100).toFixed()}%`;

    el.style.transform = `scale(${scale.toString()})`;
    el.style.willChange = "transform";
    el.style.transition = "transform 250ms ease";
  }, [focus, scale]);

  useEffect(() => {
    return () => {
      if (jumpTimeoutRef.current) {
        clearTimeout(jumpTimeoutRef.current);
        jumpTimeoutRef.current = null;
      }
    };
  }, []);

  const extractYouTubeId = useCallback((url: string): string | null => {
    try {
      const urlObj = new URL(url);

      if (urlObj.hostname === "youtu.be") {
        return urlObj.pathname.slice(1);
      }

      if (urlObj.hostname.includes("youtube.com")) {
        if (urlObj.pathname === "/watch") {
          return urlObj.searchParams.get("v");
        }
        const match = /\/(?:embed|shorts|live)\/([\w-]{11})/.exec(
          urlObj.pathname,
        );
        if (!match) return null;
        return match[1];
      }
    } catch {
      return null;
    }

    return null;
  }, []);

  const validateAndCleanUrl = useCallback(
    (url: string): string | null => {
      const videoId = extractYouTubeId(url);
      if (videoId?.length !== 11) return null;
      return `https://www.youtube.com/watch?v=${videoId}`;
    },
    [extractYouTubeId],
  );

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();

      const cleanUrl = validateAndCleanUrl(inputValue.trim());
      if (!cleanUrl) {
        setError("Invalid YouTube URL. Try: https://youtu.be/VIDEO_ID");
        return;
      }

      setError("");
      setVideo({
        id: uuidv4(),
        url: cleanUrl,
        name: currentTitle ?? "Untitled",
        addedAt: new Date().toISOString(),
        provider: "youtube",
      });
    },
    [inputValue, validateAndCleanUrl, currentTitle],
  );

  const handleSetInputValue = useCallback((value: string) => {
    setInputValue(value);
  }, []);

  const handleResetFocusAndScale = useCallback((e: React.SyntheticEvent) => {
    e.stopPropagation();
    setFocus({ x: 0.5, y: 0.5 });
    setScale(1);
  }, []);

  const handleMapView = useCallback((e: React.SyntheticEvent) => {
    e.stopPropagation();
    setScale(2.7);
    setFocus({ x: 0.02, y: 0.05 });
  }, []);

  const handleNoteJump = useCallback((time: number) => {
    const el = playerRef.current;
    if (!el) return;

    try {
      el.currentTime = time;
      if (typeof el.play === "function") {
        void el.play();
      }
    } catch {
      // Ignore errors
    }
  }, []);

  const handleUpdateVideoName = useCallback((name: string) => {
    setVideo((prev) => (prev ? { ...prev, name } : prev));
  }, []);

  const loadVideoFromUrl = useCallback(
    (url: string, name?: string): boolean => {
      const cleanUrl = validateAndCleanUrl(url.trim());
      if (!cleanUrl) {
        setError("Invalid YouTube URL. Try: https://youtu.be/VIDEO_ID");
        return false;
      }

      setError("");

      const currentUrl = video?.url ?? null;
      if (currentUrl === cleanUrl) {
        setInputValue(cleanUrl);
        if (name && video) {
          setVideo((prev) => (prev ? { ...prev, name } : prev));
        }
        return false;
      }

      setVideo({
        id: uuidv4(),
        url: cleanUrl,
        name: name ?? currentTitle ?? "Untitled",
        addedAt: new Date().toISOString(),
        provider: "youtube",
      });
      setInputValue(cleanUrl);
      return true;
    },
    [validateAndCleanUrl, currentTitle, video],
  );

  const handleHash = useCallback(() => {
    try {
      const raw = window.location.hash || "";
      if (!raw) return;
      const hash = raw.replace(/^#/, "");
      const params = new URLSearchParams(hash);
      const v = params.get("v");
      const t = params.get("t");
      if (!v) return;
      const videoUrl = decodeURIComponent(v);
      setIsFromTimestampUrl(true);
      const time = t ? Number(t) : NaN;
      const loaded = loadVideoFromUrl(videoUrl);

      if (!Number.isNaN(time)) {
        if (jumpTimeoutRef.current) clearTimeout(jumpTimeoutRef.current);

        jumpTimeoutRef.current = setTimeout(
          () => {
            jumpTimeoutRef.current = null;
            handleNoteJump(time);
          },
          loaded ? 300 : 500,
        );
      }
    } catch {
      //
    }
  }, [loadVideoFromUrl, handleNoteJump, setIsFromTimestampUrl]);

  useEffect(() => {
    if (!currentTitle) return;
    requestAnimationFrame(() => {
      setVideo((prev) => {
        if (!prev) return prev;
        if (prev.name === currentTitle) return prev;
        return { ...prev, name: currentTitle };
      });
    });
  }, [currentTitle, setVideo]);

  return {
    video,
    setVideo,
    handleSubmit,
    handleSetInputValue,
    handleResetFocusAndScale,
    inputValue,
    error,
    playerRef,
    focus,
    scale,
    handleMapView,
    handleNoteJump,
    loadVideoFromUrl,
    handleUpdateVideoName,
    handleHash,
  };
};
