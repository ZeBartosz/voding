import { lazy, Suspense, useCallback, useMemo, useState, useEffect } from "react";
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
import { cleanVideoParams } from "./utils/urlParams";
import { InputArea } from "./components/notes/InputTextarea";
import { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts";
const VideoPlayer = lazy(() => import("./components/VideoPlayer"));
const ResultBox = lazy(() => import("./components/Notes"));

function App() {
  const [sharedFromUrl, setSharedFromUrl] = useState<boolean>(false);
  const { handleProgress, currentTimeRef, currentTitle, handleTitleChange, setCurrentTitle } =
    useVideoMetaData();
  const { save, voddingList, deleteVodById, loadWithId, loading, loadAll, vodding, setVodding } =
    useSession(setCurrentTitle);
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
  } = useLink(currentTitle, setSharedFromUrl, loadWithId);
  const initialNotesSource = sharedFromUrl && urlNotes.length > 0 ? urlNotes : vodding?.notes;
  const notes = useNotes(currentTimeRef, initialNotesSource, handleNoteJump);
  const { lastSavedAt, onRestoring, prevNotesRef } = useNotesAutosave({
    notes: notes.items,
    vodding,
    video,
    save,
    sharedFromUrl,
  });
  const { copyShareableUrl } = useUrlSync({
    video,
    notes: notes.items,
    sharedFromUrl,
  });
  const [saving, setSaving] = useState<boolean>(false);

  const handleSaveShared = useCallback(async (): Promise<boolean> => {
    try {
      if (saving) return false;
      if (!sharedFromUrl) return false;
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
        notes.setNotes(payload.notes);
        setVideo(payload.video);
        setSharedFromUrl(false);
        clearUrlNotes();
        return true;
      }

      return false;
    } catch {
      return false;
    } finally {
      setSaving(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    urlNotes,
    video,
    vodding,
    save,
    notes.setNotes,
    setVideo,
    clearUrlNotes,
    setSharedFromUrl,
    saving,
    sharedFromUrl,
  ]);

  const exportOptions = useMemo(
    () => ({
      title: video?.name ?? currentTitle,
      videoUrl: video?.url ?? "",
      notes: notes.items,
      filename: `${(video?.name ?? "session").replace(/\s+/g, "_")}.pdf`,
    }),
    [video?.name, video?.url, currentTitle, notes.items],
  );

  const { exporting, handleExport } = useExportPdf(exportOptions);

  useEffect(() => {
    void handleHash();
    const listener = () => {
      void handleHash();
    };
    window.addEventListener("hashchange", listener);
    return () => {
      window.removeEventListener("hashchange", listener);
    };
  }, [handleHash]);

  useEffect(() => {
    return () => {
      window.localStorage.removeItem("current_vodding_id");
    };
  }, []);

  const handleNewSession = useCallback(() => {
    notes.setNotes([]);
    setVideo(null);
    setVodding(null);
    handleSetInputValue("");
    if (prevNotesRef.current) prevNotesRef.current = [];
    setSharedFromUrl(false);
    clearUrlNotes();
    window.localStorage.removeItem("current_vodding_id");

    try {
      const newUrl = cleanVideoParams();
      if (typeof window !== "undefined" && typeof window.history.replaceState === "function") {
        window.history.replaceState(null, "", newUrl);
      } else {
        //
      }
    } catch {
      //
    }

    try {
      void loadAll();
    } catch {
      //
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    handleSetInputValue,
    loadAll,
    setVideo,
    notes.setNotes,
    prevNotesRef,
    clearUrlNotes,
    setVodding,
  ]);

  const shortcutsBindings = useMemo(
    () => ({
      "alt+n": (e: KeyboardEvent) => {
        e.preventDefault();
        handleNewSession();
      },
      "alt+e": (e: KeyboardEvent) => {
        e.preventDefault();
        handleExport();
      },
    }),
    [handleNewSession, handleExport],
  );

  useKeyboardShortcuts(shortcutsBindings);

  return (
    <div className="container">
      <Topbar
        video={video}
        lastSavedAt={lastSavedAt}
        exporting={exporting}
        handleExport={handleExport}
        handleNewSession={handleNewSession}
        onCopyShareableUrl={copyShareableUrl}
        onSaveShared={sharedFromUrl ? handleSaveShared : undefined}
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
                  {sharedFromUrl
                    ? "Read-only session — notes are disabled"
                    : "Add your observations"}
                </div>
              </div>
              <div className="dot">•</div>
            </div>

            <div className="input-container">
              <Suspense fallback={<NotesSkeleton />}>
                <ResultBox
                  handleNoteJump={handleNoteJump}
                  readOnly={sharedFromUrl}
                  notes={notes.items}
                  editNote={notes.editNote}
                  editingId={notes.editingId}
                  setEditingId={notes.setEditingId}
                  editingValue={notes.editingValue}
                  setEditingValue={notes.setEditingValue}
                  query={notes.query}
                  setQuery={notes.setQuery}
                  deleteNote={notes.deleteNote}
                  resultsRef={notes.resultsRef}
                  filtered={notes.filtered}
                  selectedNoteId={notes.selectedNoteId}
                  setSelectedNoteId={notes.setSelectedNoteId}
                />
              </Suspense>
              <InputArea
                handleKeyDown={notes.handleKeyDown}
                handleMapView={handleMapView}
                handleResetFocusAndScale={handleResetFocusAndScale}
                readOnly={sharedFromUrl}
                addNote={notes.addNote}
                textareaRef={notes.textareaRef}
                inputValue={notes.inputValue}
                setInputValue={notes.setInputValue}
              />
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}

export default App;
