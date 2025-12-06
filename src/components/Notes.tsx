import {
  type Dispatch,
  type SetStateAction,
  type RefObject,
  type KeyboardEvent,
  type SyntheticEvent,
  useMemo,
  useState,
} from "react";
import { useNotes } from "../hooks/useNotes";

const formatTime = (seconds: number): string => {
  if (!Number.isFinite(seconds) || seconds <= 0) return "0:00";

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  }
  return `${minutes}:${secs.toString().padStart(2, "0")}`;
};

const ResultBox = ({
  currentTime,
  handleMapView,
  handleResetFocusAndScale,
  handleNoteJump,
}: {
  currentTime: RefObject<number>;
  handleMapView: (e: SyntheticEvent) => void;
  handleResetFocusAndScale: (e: SyntheticEvent) => void;
  handleNoteJump: (time: number) => void;
}) => {
  const {
    notes,
    inputValue,
    setInputValue,
    addNote,
    deleteNote,
    textareaRef,
    resultsRef,
    handleKeyDown,
  } = useNotes(currentTime);

  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    if (!query) return notes;
    const q = query.toLowerCase().trim();
    return notes.filter(
      (n) =>
        n.content.toLowerCase().includes(q) ||
        formatTime(n.timestamp).includes(q),
    );
  }, [notes, query]);

  return (
    <>
      <div className="result-list-root">
        <div className="result-list-top">
          <input
            aria-label="Search notes"
            placeholder="Search notes..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="notes-search"
          />
          <div className="notes-pill">
            {notes.length} {notes.length === 1 ? "note" : "notes"}
          </div>
        </div>

        <div className="result-box" ref={resultsRef}>
          {filtered.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">
                <svg
                  width="28"
                  height="28"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M11 6H13V12H11V6Z"
                    fill="currentColor"
                    opacity="0.85"
                  />
                  <path
                    d="M12 17.25C10.481 17.25 9.25 16.019 9.25 14.5C9.25 12.981 10.481 11.75 12 11.75C13.519 11.75 14.75 12.981 14.75 14.5C14.75 16.019 13.519 17.25 12 17.25Z"
                    fill="currentColor"
                    opacity="0.6"
                  />
                </svg>
              </div>
              <div className="empty-title">
                {query ? "No notes match your search" : "No notes yet"}
              </div>
              <div className="empty-sub">
                {query
                  ? "Try changing or clearing your search."
                  : "Add your first note below"}
              </div>
            </div>
          ) : (
            filtered.map((n) => (
              <div key={n.id} className="result-card">
                <div className="result-card-header">
                  <div className="result-meta">
                    <span className="timestamp">{formatTime(n.timestamp)}</span>
                  </div>
                  <div className="result-actions-row">
                    <button
                      onClick={() => {
                        handleNoteJump(n.timestamp);
                      }}
                      aria-label="Jump to note"
                      className="btn btn-ghost"
                    >
                      Jump
                    </button>
                    <button
                      onClick={() => {
                        const index = notes.findIndex(
                          (note) => note.id === n.id,
                        );
                        if (index !== -1) deleteNote(index);
                      }}
                      aria-label="Delete note"
                      className="btn"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                <div className="result-content">{n.content}</div>
              </div>
            ))
          )}
        </div>

        <InputBox
          inputValue={inputValue}
          setInputValue={setInputValue}
          addNote={addNote}
          textareaRef={textareaRef}
          handleKeyDown={handleKeyDown}
          handleMapView={handleMapView}
          handleResetFocusAndScale={handleResetFocusAndScale}
        />
      </div>
    </>
  );
};

const InputBox = ({
  inputValue,
  setInputValue,
  addNote,
  textareaRef,
  handleKeyDown,
  handleMapView,
  handleResetFocusAndScale,
}: {
  inputValue: string;
  setInputValue: Dispatch<SetStateAction<string>>;
  addNote: () => void;
  textareaRef: RefObject<HTMLTextAreaElement | null>;
  handleKeyDown: (e: KeyboardEvent<HTMLTextAreaElement>) => void;
  handleMapView: (e: SyntheticEvent) => void;
  handleResetFocusAndScale: (e: SyntheticEvent) => void;
}) => {
  return (
    <div className="input-box">
      <textarea
        ref={textareaRef}
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        placeholder="Write your observation..."
        onKeyDown={handleKeyDown}
      />
      <div className="button-box">
        <div>
          <button
            onClick={handleResetFocusAndScale}
            aria-label="Reset zoom"
            className="btn btn-ghost"
          >
            Reset
          </button>
          <button
            onClick={handleMapView}
            aria-label="Map View"
            className="btn btn-ghost"
          >
            Map View
          </button>
        </div>
        <button onClick={addNote} className="btn btn-primary">
          + Add Note
        </button>
      </div>
    </div>
  );
};

export default ResultBox;
