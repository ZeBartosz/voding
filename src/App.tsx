import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import VideoPlayer from "./components/VideoPlayer";
import "./css/App.css";
import "./css/Notes.css";
import "./css/VideoPlayer.css";
import { useLink } from "./hooks/useLink";
import { useSession } from "./hooks/useSession";
import { useVideoMetaData } from "./hooks/useVideoMetaData";
import type { Note } from "./types";
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

  const [notes, setNotes] = useState<Note[]>([]);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);

  const autosaveTimer = useRef<number | null>(null);
  const prevNotesRef = useRef<Note[] | null>(null);
  const isRestoringRef = useRef<boolean>(false);
  const restoreClearTimer = useRef<number | null>(null);

  useEffect(() => {
    if (vodding?.notes) {
      requestAnimationFrame(() => {
        setNotes(vodding.notes);
      });
      prevNotesRef.current = vodding.notes;
    } else {
      prevNotesRef.current = null;
    }
  }, [vodding]);

  useEffect(() => {
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

    const doSave = async () => {
      try {
        if (!vodding && !video) return;

        const currentVideo = video ?? vodding?.video;
        if (!currentVideo) return;

        const payload = vodding
          ? {
              ...vodding,
              video: video ?? vodding.video,
              notes,
              updatedAt: new Date().toISOString(),
            }
          : {
              id: uuidv4(),
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              video: currentVideo,
              notes,
            };
        await save(payload);
        setLastSavedAt(new Date().toISOString());
      } catch {
        //
      }
    };

    if (edited || deleted) {
      void doSave();
      prevNotesRef.current = notes;
      return;
    }

    autosaveTimer.current = window.setTimeout(async () => {
      await doSave();
      prevNotesRef.current = notes;
    }, 700);

    return () => {
      if (autosaveTimer.current) {
        window.clearTimeout(autosaveTimer.current);
        autosaveTimer.current = null;
      }
    };
  }, [notes, save, video, vodding, currentTitle]);

  const handleNewSession = async () => {
    setNotes([]);
    setVideo(null);
    handleSetInputValue("");

    prevNotesRef.current = [];
    await loadAll();
  };

  return (
    <>
      <div className="container">
        <div className="topbar">
          <div className="brand">
            <div
              className="brand-badge"
              onClick={() => void handleNewSession()}
              style={{ cursor: "pointer" }}
              title="Start new session"
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
              <div className="small">Session Notes</div>
              {lastSavedAt && (
                <div style={{ marginLeft: 12, fontSize: 12, color: "#666" }}>
                  Saved {new Date(lastSavedAt).toLocaleTimeString()}
                </div>
              )}
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
              onRestoring={(isRestoring: boolean) => {
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
              }}
            />
          </div>

          {video && (
            <aside className="sidebar">
              <div className="sidebar-header">
                <div className="header-left">
                  <div className="h1">Session Notes</div>
                  <div className="small">Add your observations</div>
                </div>
                <div className="dot">•</div>
              </div>

              <div className="input-container">
                <Suspense
                  fallback={
                    <div className="results-loading">
                      Loading session notes…
                    </div>
                  }
                >
                  <ResultBox
                    currentTime={currentTimeRef}
                    handleNoteJump={handleNoteJump}
                    handleMapView={handleMapView}
                    handleResetFocusAndScale={handleResetFocusAndScale}
                    initialNotes={notes}
                    onNotesChange={(n: Note[]) => {
                      setNotes(n);
                    }}
                  />
                </Suspense>
              </div>
            </aside>
          )}
        </div>
      </div>
    </>
  );
}

export default App;
