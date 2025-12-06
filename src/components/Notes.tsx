import { useState, type MutableRefObject } from "react";

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
}: {
  currentTime: MutableRefObject<number>;
}) => {
  const [notes, setNotes] = useState<Note[]>([]);

  return (
    <>
      <div className="result-box">
        {notes.map((n) => (
          <div key={n.id} className="result-card">
            <p>{n.content}</p>
            <p>{formatTime(n.timestamp)}</p>
          </div>
        ))}
      </div>
      <InputBox setNotes={setNotes} currentTime={currentTime} />
    </>
  );
};

const InputBox = ({
  setNotes,
  currentTime,
}: {
  setNotes: React.Dispatch<React.SetStateAction<Note[]>>;
  currentTime: MutableRefObject<number>;
}) => {
  const [inputValue, setInputValue] = useState("");

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

  return (
    <div className="input-box">
      <input
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        placeholder="Take a note..."
        onKeyUp={(e) => e.key === "Enter" && addNote()}
      />
      <button onClick={addNote}>Add Note</button>
    </div>
  );
};

export default ResultBox;
