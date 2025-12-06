import { useCallback, useEffect, useRef, useState } from "react";

export const useLink = () => {
  const [url, setUrl] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState<string>("");
  const [error, setError] = useState<string>("");

  const playerRef = useRef<HTMLVideoElement>(null);
  const [focus, setFocus] = useState({ x: 0.5, y: 0.5 });
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const internal =
      playerRef.current?.getInternalPlayer?.() ?? playerRef.current;
    if (!internal) return;

    const el: HTMLElement = internal.nodeName ? internal : internal;

    el.style.transformOrigin = `${focus.x * 100}% ${focus.y * 100}%`;
    el.style.transform = `scale(${scale})`;
    el.style.willChange = "transform";
    el.style.transition = "transform 250ms ease";
  }, [focus, scale]);

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
        const match = urlObj.pathname.match(/\/(?:embed|shorts)\/([\w-]{11})/);
        return match ? match[1] : null;
      }
    } catch {
      return null;
    }

    return null;
  }, []);

  const validateAndCleanUrl = useCallback(
    (url: string): string | null => {
      const videoId = extractYouTubeId(url);
      if (!videoId || videoId.length !== 11) return null;
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
      setUrl(cleanUrl);
    },
    [inputValue, validateAndCleanUrl],
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
    setScale(3);
    setFocus({ x: 0.02, y: 0.2 });
  }, []);

  return {
    url,
    setUrl,
    handleSubmit,
    handleSetInputValue,
    handleResetFocusAndScale,
    inputValue,
    error,
    playerRef,
    focus,
    scale,
    handleMapView,
  };
};
