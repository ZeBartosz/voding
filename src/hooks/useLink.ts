import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";
import type { Note, Video, VoddingPayload } from "../types";
import type { ReactPlayerRef } from "../types/player";
import { v4 as uuidv4 } from "uuid";
import { parseHashParams } from "../utils/urlParams";
import { useKeyboardShortcuts } from "./useKeyboardShortcuts";

interface ApiSeekable {
  api: { seekTo: (time: number, units?: string | boolean) => void };
}

export const useLink = (
  currentTitle: string | null,
  setSharedFromUrl: Dispatch<SetStateAction<boolean>>,
  loadWithId: (id: string) => Promise<VoddingPayload | null>,
) => {
  const [video, setVideo] = useState<Video | null>(null);
  const [inputValue, setInputValue] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [urlNotes, setUrlNotes] = useState<Note[]>([]);
  const [focus, setFocus] = useState({ x: 0.5, y: 0.5 });
  const [scale, setScale] = useState(1);

  const jumpTimeoutRef = useRef<number | null>(null);
  const playerRef = useRef<ReactPlayerRef | HTMLVideoElement | null>(null);
  const mapViewRef = useRef<boolean>(false);

  useEffect(() => {
    const player = playerRef.current;
    if (!player) return;

    const el = player as HTMLElement;
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
        const match = /\/(?:embed|shorts|live)\/([\w-]{11})/.exec(urlObj.pathname);
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

  const handleResetFocusAndScale = useCallback((e?: React.SyntheticEvent) => {
    e?.stopPropagation();
    mapViewRef.current = false;
    setFocus({ x: 0.5, y: 0.5 });
    setScale(1);
  }, []);

  const handleMapView = useCallback((e?: React.SyntheticEvent) => {
    e?.stopPropagation();
    mapViewRef.current = true;
    setScale(2.7);
    setFocus({ x: 0.02, y: 0.05 });
  }, []);

  const isReactPlayerRef = useCallback((p: unknown): p is ReactPlayerRef => {
    return (
      typeof p === "object" &&
      p !== null &&
      "getInternalPlayer" in (p as Record<string, unknown>) &&
      typeof (p as ReactPlayerRef).getInternalPlayer === "function"
    );
  }, []);

  const hasApiSeekTo = useCallback((p: unknown): p is ApiSeekable => {
    if (typeof p !== "object" || p === null) return false;
    const obj = p as Record<string, unknown>;
    if (!("api" in obj)) return false;
    const api = obj.api;
    return (
      typeof api === "object" &&
      api !== null &&
      typeof (api as Record<string, unknown>).seekTo === "function"
    );
  }, []);

  const isHtmlMediaElement = useCallback((p: unknown): p is HTMLMediaElement => {
    try {
      return p instanceof HTMLMediaElement;
    } catch {
      return (
        typeof p === "object" &&
        p !== null &&
        "currentTime" in (p as Record<string, unknown>) &&
        "play" in (p as Record<string, unknown>)
      );
    }
  }, []);

  const handleNoteJump = useCallback(
    (time: number) => {
      const player = playerRef.current;
      if (!player) return;

      try {
        if (hasApiSeekTo(player)) {
          try {
            (player as ApiSeekable).api.seekTo(time, "seconds");
          } catch {
            //
          }

          if (isHtmlMediaElement(player)) {
            const media = player as HTMLMediaElement;
            if (media.paused) void media.play();
            return;
          }
          return;
        }

        if (isReactPlayerRef(player)) {
          const getInternal = player.getInternalPlayer;
          if (typeof getInternal === "function") {
            const internal = getInternal();
            if (internal) {
              const anyInternal = internal;

              if (anyInternal?.api && typeof anyInternal.api.seekTo === "function") {
                anyInternal.api.seekTo(time, "seconds");
              } else if (typeof anyInternal.seekTo === "function") {
                anyInternal.seekTo(time, true);
              } else if (
                typeof anyInternal.getCurrentTime === "function" &&
                typeof anyInternal.playVideo === "function"
              ) {
                anyInternal.playVideo();
              } else if (typeof anyInternal.playVideo === "function") {
                anyInternal.playVideo();
              }

              return;
            }
          }
        }

        if (isHtmlMediaElement(player)) {
          const media = player as HTMLMediaElement;
          media.currentTime = time;
          if (media.paused) void media.play();
          return;
        }
      } catch {
        //
      }
    },
    [hasApiSeekTo, isHtmlMediaElement, isReactPlayerRef],
  );

  const togglePlay = useCallback(() => {
    const player = playerRef.current;
    if (!player) return;

    try {
      if (isHtmlMediaElement(player)) {
        const media = player as HTMLMediaElement;
        if (media.paused) void media.play();
        else media.pause();
        return;
      }

      if (isReactPlayerRef(player)) {
        const internal = player.getInternalPlayer;
        if (internal && typeof internal.getPlayerState === "function") {
          const state = internal.getPlayerState();
          if (state === 1) {
            if (typeof internal.pauseVideo === "function") internal.pauseVideo();
          } else {
            if (typeof internal.playVideo === "function") internal.playVideo();
          }
          return;
        }

        if ("play" in player && "pause" in player && typeof player.play === "function") {
          const media = player as unknown as HTMLMediaElement;
          if (media.paused) void media.play();
          else media.pause();
          return;
        }
      }

      if (hasApiSeekTo(player)) {
        const api = (player as ApiSeekable & Record<string, unknown>).api as Record<
          string,
          unknown
        >;
        const state = api.getPlayerState();
        const paused = state !== 1;
        if (paused && "playVideo" in api && typeof api.playVideo === "function") {
          api.playVideo();
          return;
        } else if (!paused && "pauseVideo" in api && typeof api.pauseVideo === "function") {
          api.pauseVideo();
          return;
        }
      }
    } catch {
      //
    }
  }, [hasApiSeekTo, isHtmlMediaElement, isReactPlayerRef]);

  const seekBy = useCallback(
    (seconds: number) => {
      const player = playerRef.current;
      if (!player) return;

      try {
        // 1) standard HTMLMediaElement
        if (isHtmlMediaElement(player)) {
          const media = player as HTMLMediaElement;
          const currentTime = Number.isFinite(media.currentTime) ? media.currentTime : 0;
          const duration = Number.isFinite(media.duration) ? media.duration : Infinity;
          const newTime = Math.max(0, Math.min(duration, currentTime + seconds));
          media.currentTime = newTime;
          return;
        }

        if (isReactPlayerRef(player)) {
          const internal = player.getInternalPlayer?.();
          if (internal) {
            const hasGetCurrent = typeof (internal as any).getCurrentTime === "function";
            const hasGetDuration = typeof (internal as any).getDuration === "function";
            const currentTime = hasGetCurrent ? (internal as any).getCurrentTime() : 0;
            const duration = hasGetDuration ? (internal as any).getDuration() : Infinity;
            const newTime = Math.max(0, Math.min(duration, currentTime + seconds));
            if (typeof (internal as any).seekTo === "function") {
              (internal as any).seekTo(newTime, true);
            } else if (typeof (internal as any)?.api?.seekTo === "function") {
              (internal as any).api.seekTo(newTime, "seconds");
            }
            return;
          }
        }

        if (hasApiSeekTo(player)) {
          const current = "currentTime" in player ? ((player as any).currentTime ?? 0) : 0;
          const duration = "duration" in player ? ((player as any).duration ?? Infinity) : Infinity;
          const newTime = Math.max(0, Math.min(duration, current + seconds));
          player.api.seekTo(newTime, "seconds");
          return;
        }
      } catch (e) {
        //
      }
    },
    [hasApiSeekTo, isHtmlMediaElement, isReactPlayerRef],
  );

  const adjustVolume = useCallback(
    (delta: number) => {
      const player = playerRef.current;
      if (!player) return;

      try {
        // HTMLMediaElement first
        if (isHtmlMediaElement(player)) {
          const media = player as HTMLMediaElement;
          const current = typeof media.volume === "number" ? media.volume : 1;
          const newVolume = Math.max(0, Math.min(1, current + delta));
          media.volume = newVolume;
          return;
        }

        if (isReactPlayerRef(player)) {
          const internal = player.getInternalPlayer?.();
          if (
            internal &&
            typeof (internal as any).getVolume === "function" &&
            typeof (internal as any).setVolume === "function"
          ) {
            const current = ((internal as any).getVolume() as number) / 100;
            const newVolume = Math.max(0, Math.min(1, current + delta));
            (internal as any).setVolume(Math.round(newVolume * 100));
            return;
          }

          if ("volume" in player && typeof (player as any).volume === "number") {
            try {
              (player as any).volume = Math.max(0, Math.min(1, (player as any).volume + delta));
              return;
            } catch {
              //
            }
          }
        }

        if ("volume" in (player as Record<string, unknown>)) {
          const v = player.volume;
          if (typeof v === "number") {
            try {
              player.volume = Math.max(0, Math.min(1, v + delta));
            } catch {
              //
            }
          }
          return;
        }
      } catch {
        //
      }
    },
    [isHtmlMediaElement, isReactPlayerRef],
  );

  const isTyping = useCallback(() => {
    const active = document.activeElement;
    return (
      active?.tagName === "INPUT" ||
      active?.tagName === "TEXTAREA" ||
      active?.getAttribute("contenteditable") === "true"
    );
  }, []);

  const shortcutsBindings = useMemo(
    () => ({
      "alt+m": (e: KeyboardEvent) => {
        if (!video) return;
        e.preventDefault();
        if (mapViewRef.current) handleResetFocusAndScale();
        else handleMapView();
      },
      space: (e: KeyboardEvent) => {
        if (!video || isTyping()) return;
        e.preventDefault();
        togglePlay();
      },
      k: (e: KeyboardEvent) => {
        if (!video || isTyping()) return;
        e.preventDefault();
        togglePlay();
      },
      j: (e: KeyboardEvent) => {
        if (!video || isTyping()) return;
        e.preventDefault();
        seekBy(-5);
      },
      l: (e: KeyboardEvent) => {
        if (!video || isTyping()) return;
        e.preventDefault();
        seekBy(5);
      },
      arrowleft: (e: KeyboardEvent) => {
        if (!video || isTyping()) return;
        e.preventDefault();
        seekBy(-10);
      },
      arrowright: (e: KeyboardEvent) => {
        if (!video || isTyping()) return;
        e.preventDefault();
        seekBy(10);
      },
      arrowup: (e: KeyboardEvent) => {
        if (!video || isTyping()) return;
        e.preventDefault();
        adjustVolume(0.1);
      },
      arrowdown: (e: KeyboardEvent) => {
        if (!video || isTyping()) return;
        e.preventDefault();
        adjustVolume(-0.1);
      },
    }),
    [adjustVolume, handleMapView, handleResetFocusAndScale, isTyping, seekBy, togglePlay, video],
  );

  useKeyboardShortcuts(shortcutsBindings);

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

  const handleHash = useCallback(async () => {
    try {
      const { videoUrl, notes, shared } = parseHashParams();

      if (!videoUrl) return;

      // If we have notes from URL, this is a shared session (read-only)
      const hasUrlNotes = notes.length > 0;

      // Set read-only mode if we have notes or timestamp from URL
      setSharedFromUrl(shared);

      if (!shared) {
        const id = localStorage.getItem("current_vodding_id");
        if (id) {
          const data = await loadWithId(id);
          if (data) {
            const currentUrl = video?.url ?? null;
            if (currentUrl !== data.video.url) {
              setVideo(data.video);
            }
            setUrlNotes(data.notes);
            return;
          }
        }
      }

      // Store notes from URL
      if (hasUrlNotes) {
        setUrlNotes(notes);
      }

      const loaded = loadVideoFromUrl(videoUrl);

      if (notes.length === 1 && notes[0].timestamp) {
        if (jumpTimeoutRef.current) clearTimeout(jumpTimeoutRef.current);

        jumpTimeoutRef.current = window.setTimeout(
          () => {
            jumpTimeoutRef.current = null;
            if (typeof notes[0].timestamp === "number") {
              handleNoteJump(notes[0].timestamp);
            }
          },
          loaded ? 300 : 500,
        );
      }
    } catch (e) {
      //
      console.debug("handleHash error", e);
    }
  }, [loadVideoFromUrl, handleNoteJump, setSharedFromUrl, loadWithId, video]);

  const clearUrlNotes = useCallback(() => {
    setUrlNotes([]);
  }, []);

  useEffect(() => {
    if (!currentTitle) return;
    requestAnimationFrame(() => {
      setVideo((prev) => {
        if (!prev) return prev;
        if (prev.name === currentTitle) return prev;
        return { ...prev, name: currentTitle };
      });
    });
  }, [currentTitle]);

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
    urlNotes,
    clearUrlNotes,
  };
};
