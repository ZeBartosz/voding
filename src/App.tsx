import {
  lazy,
  Suspense,
  useCallback,
  useMemo,
  useState,
  useEffect,
} from "react";
import "./css/App.css";
import "./css/Notes.css";
import "./css/VideoPlayer.css";
import { useLink } from "./hooks/useLink";
import { useSession } from "./hooks/useSession";
import { useVideoMetaData } from "./hooks/useVideoMetaData";
import useExportPdf from "./hooks/useExportPdf";
import { useNotes } from "./hooks/useNotes";
import useNotesAutosave from "./hooks/useNotesAutosave";
import { useUrlSync } from "./hooks/useUrlSync";
import Topbar from "./components/Topbar";
import NotesSkeleton from "./components/ui/NotesSkeleton";
import Skeleton from "./components/ui/skeleton";
import { v4 as uuidv4 } from "uuid";
const VideoPlayer = lazy(() => import("./components/VideoPlayer"));
const ResultBox = lazy(() => import("./components/Notes"));

function App() {
  const [isFromTimestampUrl, setIsFromTimestampUrl] = useState<boolean>(false);
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
    handleHash,
    urlNotes,
    clearUrlNotes,
  } = useLink(currentTitle, setIsFromTimestampUrl);
  const {
    save,
    voddingList,
    deleteVodById,
    loadWithId,
    loading,
    loadAll,
    vodding,
  } = useSession(setCurrentTitle);
  const initialNotesSource =
    isFromTimestampUrl && urlNotes.length > 0 ? urlNotes : vodding?.notes;
  const { notes, setNotes } = useNotes(currentTimeRef, initialNotesSource);
  const { lastSavedAt, onRestoring, prevNotesRef } = useNotesAutosave({
    notes,
    vodding,
    video,
    save,
    isFromTimestampUrl,
  });
  const { copyShareableUrl } = useUrlSync({
    video,
    notes,
    isFromTimestampUrl,
  });
  const [saving, setSaving] = useState<boolean>(false);

  const handleSaveShared = useCallback(async (): Promise<boolean> => {
    try {
      if (saving) return false;
      if (urlNotes.length === 0) return false;
      setSaving(true);

      const currentVideo = video ?? vodding?.video;
      if (!currentVideo) return false;

      const now = new Date().toISOString();

      let payload;
      if (vodding) {
        payload = {
          ...vodding,
          video: currentVideo,
          notes: urlNotes,
          updatedAt: now,
        };
      } else {
        payload = {
          id: uuidv4(),
          createdAt: now,
          updatedAt: now,
          video: currentVideo,
          notes: urlNotes,
        };
      }

      const savedPayload = await save(payload);

      if (savedPayload.id) {
        setNotes(payload.notes);
        setVideo(payload.video);
        setIsFromTimestampUrl(false);
        clearUrlNotes();
        return true;
      }

      return false;
    } catch {
      return false;
    } finally {
      setSaving(false);
    }
  }, [
    urlNotes,
    video,
    vodding,
    save,
    setNotes,
    setVideo,
    clearUrlNotes,
    setIsFromTimestampUrl,
    saving,
  ]);

  const exportOptions = useMemo(
    () => ({
      title: video?.name ?? currentTitle,
      videoUrl: video?.url ?? "",
      notes,
      filename: `${(video?.name ?? "session").replace(/\s+/g, "_")}.pdf`,
    }),
    [video?.name, video?.url, currentTitle, notes],
  );

  const { exporting, handleExport } = useExportPdf(exportOptions);

  useEffect(() => {
    handleHash();
    window.addEventListener("hashchange", handleHash);
    return () => {
      window.removeEventListener("hashchange", handleHash);
    };
  }, [handleHash]);

  const handleNewSession = useCallback(() => {
    (() => {
      setNotes([]);
      setVideo(null);
      handleSetInputValue("");
      if (prevNotesRef.current) prevNotesRef.current = [];
      setIsFromTimestampUrl(false);
      clearUrlNotes();

      const cleanUrlParams = () => {
        const { origin, pathname, search, hash } = window.location;
        const searchParams = new URLSearchParams(
          search.startsWith("?") ? search.slice(1) : "",
        );
        searchParams.delete("v");
        searchParams.delete("t");
        searchParams.delete("n");
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
            hashParams.delete("n");
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
  }, [
    handleSetInputValue,
    loadAll,
    setVideo,
    setNotes,
    prevNotesRef,
    clearUrlNotes,
  ]);

  return (
    <div className="container">
      <Topbar
        video={video}
        lastSavedAt={lastSavedAt}
        exporting={exporting}
        handleExport={handleExport}
        handleNewSession={handleNewSession}
        currentTitle={currentTitle}
        onCopyShareableUrl={copyShareableUrl}
        onSaveShared={urlNotes.length > 0 ? handleSaveShared : undefined}
      />

      <div className="main">
        <div className="video-column">
          <Suspense fallback={<Skeleton width="1280" height="720" />}>
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
          </Suspense>
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
              <Suspense fallback={<NotesSkeleton />}>
                <ResultBox
                  currentTime={currentTimeRef}
                  handleNoteJump={handleNoteJump}
                  handleMapView={handleMapView}
                  handleResetFocusAndScale={handleResetFocusAndScale}
                  initialNotes={notes}
                  onNotesChange={setNotes}
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
