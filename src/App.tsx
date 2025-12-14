import {
  lazy,
  Suspense,
  useCallback,
  useMemo,
  useState,
  useEffect,
} from "react";

import VideoPlayer from "./components/VideoPlayer";
import "./css/App.css";
import "./css/Notes.css";
import "./css/VideoPlayer.css";
import { useLink } from "./hooks/useLink";
import { useSession } from "./hooks/useSession";
import { useVideoMetaData } from "./hooks/useVideoMetaData";
import useExportPdf from "./hooks/useExportPdf";
import { useNotes } from "./hooks/useNotes";
import useNotesAutosave from "./hooks/useNotesAutosave";

const ResultBox = lazy(() => import("./components/Notes"));

function App() {
  const {
    handleProgress,
    currentTimeRef,
    currentTitle,
    handleTitleChange,
    setCurrentTitle,
  } = useVideoMetaData();
  const {
    playerRef,
    video,
    setVideo,
    handleSubmit,
    inputValue,
    error,
    handleSetInputValue,
    handleMapView,
    handleResetFocusAndScale,
    handleNoteJump,
    loadVideoFromUrl,
  } = useLink(currentTitle);
  const {
    save,
    voddingList,
    deleteVodById,
    loadWithId,
    loading,
    loadAll,
    vodding,
  } = useSession(setCurrentTitle);

  const [isFromTimestampUrl, setIsFromTimestampUrl] = useState<boolean>(false);

  const { notes, setNotes } = useNotes(currentTimeRef, vodding?.notes);

  const { lastSavedAt, onRestoring, prevNotesRef } = useNotesAutosave({
    notes,
    vodding,
    video,
    save,
    isFromTimestampUrl,
  });

  const exportOptions = useMemo(
    () => ({
      title: video?.name ?? currentTitle,
      videoUrl: video?.url ?? "",
      notes,
      filename: `${(video?.name ?? "session").replace(/\s+/g, "_")}.pdf`,
    }),
    [video?.name, video?.url, currentTitle, notes],
  );

  const { exporting, exportPdf } = useExportPdf(exportOptions);

  const handleExport = useCallback(() => {
    setTimeout(() => {
      exportPdf();
    }, 0);
  }, [exportPdf]);

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

      if (!Number.isNaN(time) && typeof handleNoteJump === "function") {
        setTimeout(
          () => {
            handleNoteJump(time);
          },
          loaded ? 300 : 500,
        );
      }
    } catch {
      //
    }
  }, [loadVideoFromUrl, handleNoteJump]);

  useEffect(() => {
    const run = () => requestAnimationFrame(handleHash);
    run();
    window.addEventListener("hashchange", run);
    return () => {
      window.removeEventListener("hashchange", run);
    };
  }, [handleHash]);

  const handleNewSession = useCallback(() => {
    (() => {
      setNotes([]);
      setVideo(null);
      handleSetInputValue("");
      if (prevNotesRef.current) prevNotesRef.current = [];
      setIsFromTimestampUrl(false);

      const cleanUrlParams = () => {
        const { origin, pathname, search, hash } = window.location;
        const searchParams = new URLSearchParams(
          search.startsWith("?") ? search.slice(1) : "",
        );
        searchParams.delete("v");
        searchParams.delete("t");
        const newSearch = searchParams.toString()
          ? `?${searchParams.toString()}`
          : "";

        let newHash = "";
        if (hash && hash.length > 1) {
          const hashRaw = hash.replace(/^#/, "");
          if (hashRaw.includes("=") || hashRaw.includes("&")) {
            const hashParams = new URLSearchParams(hashRaw);
            hashParams.delete("v");
            hashParams.delete("t");
            const hashStr = hashParams.toString();
            if (hashStr) {
              newHash = `#${hashStr}`;
            }
          } else {
            newHash = `#${hashRaw}`;
          }
        }

        return `${origin}${pathname}${newSearch}${newHash}`;
      };

      try {
        const newUrl = cleanUrlParams();
        if (
          typeof window !== "undefined" &&
          typeof window.history.replaceState === "function"
        ) {
          window.history.replaceState(null, "", newUrl);
        } else if (typeof window !== "undefined") {
          try {
            window.location.replace(newUrl);
          } catch {
            window.location.hash = "";
          }
        }
      } catch {
        //
      }

      try {
        void loadAll();
      } catch {
        //
      }
    })();
  }, [handleSetInputValue, loadAll, setVideo, setNotes, prevNotesRef]);

  const onNotesChange = setNotes;

  const savedStyle: React.CSSProperties = useMemo(
    () => ({ fontSize: 12, color: "#666" }),
    [],
  );
  const rightControlsStyle: React.CSSProperties = useMemo(
    () => ({
      display: "flex",
      alignItems: "center",
      marginLeft: 12,
      gap: 12,
    }),
    [],
  );

  return (
    <div className="container">
      <div className="topbar">
        <div className="brand">
          <div
            className="brand-badge"
            onClick={handleNewSession}
            style={{ cursor: "pointer" }}
            title="Start new session"
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                handleNewSession();
              }
            }}
          >
            V
          </div>
          <div className="brand-title">
            <div className="title">{video?.name ?? "VOD Review Session"}</div>
            <div className="subtitle">Competitive Analysis</div>
          </div>
        </div>

        {video && (
          <div className="topbar-right">
            {lastSavedAt && (
              <div style={savedStyle}>
                Saved {new Date(lastSavedAt).toLocaleTimeString()}
              </div>
            )}
            <div style={rightControlsStyle}>
              <button
                onClick={handleExport}
                disabled={exporting}
                className="btn btn-ghost"
                aria-label="Export notes"
                title="Export notes to PDF"
                type="button"
              >
                {exporting ? "Exporting…" : "Export"}
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="main">
        <div className="video-column">
          <VideoPlayer
            handleProgress={handleProgress}
            handleTitleChange={handleTitleChange}
            playerRef={playerRef}
            video={video}
            handleSubmit={handleSubmit}
            inputValue={inputValue}
            error={error}
            handleSetInputValue={handleSetInputValue}
            voddingList={voddingList}
            deleteVodById={deleteVodById}
            loadWithId={loadWithId}
            loading={loading}
            setVideo={setVideo}
            onRestoring={onRestoring}
          />
        </div>

        {video && (
          <aside className="sidebar">
            <div className="sidebar-header">
              <div className="header-left">
                <div className="h1">Session Notes</div>
                <div className="small">
                  {isFromTimestampUrl
                    ? "Read-only session — notes are disabled"
                    : "Add your observations"}
                </div>
              </div>
              <div className="dot">•</div>
            </div>

            <div className="input-container">
              {isFromTimestampUrl && (
                <div
                  className="readonly-overlay"
                  role="status"
                  aria-live="polite"
                  title="Read-only session"
                >
                  <div>
                    <div className="readonly-title">Read-only session</div>
                    <div className="readonly-desc">
                      This session was opened from a timestamped link — notes
                      are read-only. You cannot add or edit notes in this view.
                    </div>
                  </div>
                </div>
              )}
              <Suspense
                fallback={
                  <div className="results-loading">Loading session notes…</div>
                }
              >
                <ResultBox
                  currentTime={currentTimeRef}
                  handleNoteJump={handleNoteJump}
                  handleMapView={handleMapView}
                  handleResetFocusAndScale={handleResetFocusAndScale}
                  initialNotes={notes}
                  onNotesChange={onNotesChange}
                  readOnly={isFromTimestampUrl}
                />
              </Suspense>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}

export default App;
