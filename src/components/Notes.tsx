import {
  type Dispatch,
  type SetStateAction,
  type RefObject,
  type KeyboardEvent,
  type SyntheticEvent,
} from "react";
import { useNotes } from "../hooks/useNotes";

const formatTime = (seconds: number): string => {
  if (!seconds || isNaN(seconds)) return "0:00";

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
}: {
  currentTime: RefObject<number>;
  handleMapView: (e: SyntheticEvent) => void;
  handleResetFocusAndScale: (e: SyntheticEvent) => void;
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

  return (
    <>
      <div className="result-box" ref={resultsRef}>
        {notes.map((n, i) => (
          <div key={n.id} className="result-card">
            <div className="result-meta">
              <span className="timestamp">{formatTime(n.timestamp)}</span>
            </div>
            <div className="result-content">{n.content}</div>
            <div className="result-actions">
              <button onClick={() => deleteNote(i)} aria-label="Delete note">
                Delete
              </button>
            </div>
          </div>
        ))}
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
        placeholder="Take a note..."
        onKeyDown={handleKeyDown}
      />
      <div className="button-box">
        <button onClick={addNote}>Add Note</button>
        <button onClick={handleResetFocusAndScale} aria-label="Reset zoom">
          Reset
        </button>
        <button onClick={handleMapView} aria-label="Map View">
          Map View
        </button>
      </div>
    </div>
  );
};

export default ResultBox;
