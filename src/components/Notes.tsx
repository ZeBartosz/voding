import { useState, useRef, useEffect, type MutableRefObject } from "react";

interface Note {
  id: number;
  content: string;
  timestamp: number;
}

const formatTime = (seconds: number): string => {
  if (!seconds || isNaN(seconds)) return "0:00";

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }
  return `${minutes}:${secs.toString().padStart(2, "0")}`;
};

const ResultBox = ({
  currentTime,
  handleMapView,
  handleResetFocusAndScale,
}: {
  currentTime: MutableRefObject<number>;
  handleMapView: (e: React.SyntheticEvent) => void;
  handleResetFocusAndScale: (e: React.SyntheticEvent) => void;
}) => {
  const [notes, setNotes] = useState<Note[]>([]);
  const resultsRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = resultsRef.current;
    if (el) {
      el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    }
  }, [notes.length]);

  return (
    <>
      <div className="result-box" ref={resultsRef}>
        {notes.map((n) => (
          <div key={n.id} className="result-card">
            <p>{formatTime(n.timestamp)}</p>
            <p>{n.content}</p>
          </div>
        ))}
      </div>
      <InputBox
        setNotes={setNotes}
        currentTime={currentTime}
        handleMapView={handleMapView}
        handleResetFocusAndScale={handleResetFocusAndScale}
      />
    </>
  );
};

const InputBox = ({
  setNotes,
  currentTime,
  handleMapView,
  handleResetFocusAndScale,
}: {
  setNotes: React.Dispatch<React.SetStateAction<Note[]>>;
  currentTime: MutableRefObject<number>;
  handleMapView: (e: React.SyntheticEvent) => void;
  handleResetFocusAndScale: (e: React.SyntheticEvent) => void;
}) => {
  const [inputValue, setInputValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const addNote = () => {
    if (!inputValue.trim()) return;

    setNotes((prev: Note[]) => [
      ...prev,
      {
        id: Date.now(),
        content: inputValue,
        timestamp: currentTime.current,
      },
    ]);

    setInputValue("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter") {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const el = textareaRef.current;
        if (!el) {
          setInputValue((prev) => prev + "\n");
          return;
        }
        const start = el.selectionStart ?? inputValue.length;
        const end = el.selectionEnd ?? inputValue.length;
        const newValue =
          inputValue.slice(0, start) + "\n" + inputValue.slice(end);
        setInputValue(newValue);
        requestAnimationFrame(() => {
          const pos = start + 1;
          el.selectionStart = el.selectionEnd = pos;
        });
        return;
      }

      e.preventDefault();
      addNote();
    }
  };

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
