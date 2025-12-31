import React, { useCallback, useEffect, useMemo, useRef, useState, type RefObject } from "react";
import { v4 as uuidv4 } from "uuid";
import { Send, Edit, Trash, Clock } from "lucide-react";
import type { Note } from "../types";

interface NotesProps {
  currentTime: RefObject<number>;
  handleMapView: (e: React.SyntheticEvent) => void;
  handleResetFocusAndScale: (e: React.SyntheticEvent) => void;
  handleNoteJump: (time: number) => void;
  initialNotes?: Note[] | null;
  onNotesChange?: (notes: Note[]) => void;
  readOnly?: boolean;
}

const formatTime = (seconds: number): string => {
  if (!Number.isFinite(seconds) || seconds <= 0) return "0:00";

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours.toString()}:${minutes.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  }
  return `${minutes.toString()}:${secs.toString().padStart(2, "0")}`;
};

const Notes: React.FC<NotesProps> = ({
  currentTime,
  handleMapView,
  handleResetFocusAndScale,
  handleNoteJump,
  initialNotes,
  onNotesChange,
  readOnly = false,
}) => {
  const controlled = typeof onNotesChange === "function";

  const [internalNotes, setInternalNotes] = useState<Note[]>(initialNotes ?? []);

  useEffect(() => {
    if (initialNotes == null) return;
    const id = requestAnimationFrame(() => {
      setInternalNotes(initialNotes);
    });
    return () => {
      cancelAnimationFrame(id);
    };
  }, [initialNotes]);

  const [inputValue, setInputValue] = useState<string>("");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState<string>("");

  const [query, setQuery] = useState<string>("");

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const resultsRef = useRef<HTMLDivElement | null>(null);

  const notes: Note[] = useMemo<Note[]>(
    () => (controlled ? (initialNotes ?? []) : internalNotes),
    [controlled, initialNotes, internalNotes],
  );

  const notify = useCallback(
    (next: Note[]) => {
      if (controlled) {
        onNotesChange(next);
      } else {
        setInternalNotes(next);
      }
    },
    [controlled, onNotesChange],
  );

  const addNote = useCallback(() => {
    if (readOnly) return;
    const text = inputValue.trim();
    if (!text) return;

    const timestamp = typeof currentTime.current === "number" ? currentTime.current : 0;

    const newNote: Note = {
      id: uuidv4(),
      content: text,
      timestamp,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const next = [...notes, newNote];
    notify(next);
    setInputValue("");
    requestAnimationFrame(() => {
      const el = resultsRef.current;
      if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    });
  }, [inputValue, currentTime, notes, notify, readOnly]);

  const deleteNote = useCallback(
    (id: string) => {
      if (readOnly) return;
      const next = notes.filter((n) => n.id !== id);
      notify(next);
    },
    [notes, notify, readOnly],
  );

  const saveEdit = useCallback(
    (id: string, newContent: string) => {
      if (readOnly) return;
      const next = notes.map((n) =>
        n.id === id ? { ...n, content: newContent, updatedAt: new Date().toISOString() } : n,
      );
      notify(next);
      setEditingId(null);
      setEditingValue("");
    },
    [notes, notify, readOnly],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key !== "Enter") return;

      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const el = textareaRef.current;
        if (!el) {
          setInputValue((prev) => prev + "\n");
          return;
        }
        const start = el.selectionStart;
        const end = el.selectionEnd;
        const newValue = inputValue.slice(0, start) + "\n" + inputValue.slice(end);
        setInputValue(newValue);
        requestAnimationFrame(() => {
          const t = textareaRef.current;
          if (t) t.selectionStart = t.selectionEnd = start + 1;
        });
        return;
      }

      e.preventDefault();
      addNote();
    },
    [inputValue, addNote],
  );

  const filtered = useMemo(() => {
    if (!query) return notes;
    const q = query.toLowerCase().trim();
    return notes.filter(
      (n) => n.content.toLowerCase().includes(q) || formatTime(n.timestamp).includes(q),
    );
  }, [notes, query]);

  useEffect(() => {
    const el = resultsRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [notes.length]);

  return (
    <div className="result-list-root">
      <div className="result-list-top">
        <input
          aria-label="Search notes"
          placeholder="Search notes..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
          }}
          className="notes-search"
        />
        <div className="notes-pill">
          {notes.length} {notes.length === 1 ? "note" : "notes"}
        </div>
      </div>

      <div className="result-box" ref={resultsRef}>
        {filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon" aria-hidden>
              <svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M11 6H13V12H11V6Z" fill="currentColor" opacity="0.85" />
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
                : readOnly
                  ? "This session is read-only."
                  : "Add your first note below"}
            </div>
          </div>
        ) : (
          filtered.map((n) => {
            const isEditing = editingId === n.id;
            return (
              <div key={n.id} className={`result-card ${isEditing ? "editing" : ""}`}>
                <div className="result-card-header">
                  <div className="result-meta">
                    <span className="timestamp">
                      <Clock size={12} className="timestamp-icon" /> {formatTime(n.timestamp)}
                    </span>
                  </div>

                  <div className="result-actions-row">
                    <button
                      onClick={() => {
                        handleNoteJump(n.timestamp);
                      }}
                      aria-label="Jump to note"
                      className="btn btn-ghost has-tooltip"
                      data-tooltip="Jump"
                    >
                      <Send size={16} />
                    </button>

                    {!isEditing && !readOnly && (
                      <button
                        onClick={() => {
                          setEditingId(n.id);
                          setEditingValue(n.content);
                        }}
                        aria-label="Edit note"
                        className="btn btn-ghost has-tooltip"
                        data-tooltip="Edit"
                      >
                        <Edit size={16} />
                      </button>
                    )}

                    {!readOnly && (
                      <button
                        onClick={() => {
                          deleteNote(n.id);
                        }}
                        aria-label="Delete note"
                        className="btn has-tooltip"
                        data-tooltip="Delete"
                      >
                        <Trash size={16} className="text-red-600" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="result-content">
                  {isEditing ? (
                    <div className="note-edit-wrap">
                      <textarea
                        autoFocus
                        className="note-edit-textarea"
                        value={editingValue}
                        readOnly={readOnly}
                        onChange={(e) => {
                          setEditingValue(e.target.value);
                        }}
                      />
                      <div className="note-edit-actions">
                        <button
                          onClick={() => {
                            saveEdit(n.id, editingValue);
                          }}
                          className="btn btn-primary"
                          disabled={readOnly}
                          title={readOnly ? "Disabled in read-only view" : undefined}
                        >
                          Save
                        </button>
                        <button
                          onClick={() => {
                            setEditingId(null);
                            setEditingValue("");
                          }}
                          className="btn btn-ghost"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="note-content">{n.content}</div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="input-box">
        <div className="textarea-wrapper">
          <textarea
            ref={textareaRef}
            value={inputValue}
            readOnly={readOnly}
            onChange={(e) => {
              setInputValue(e.target.value);
            }}
            placeholder={readOnly ? "Read-only session" : "Write your observation..."}
            onKeyDown={handleKeyDown}
            className={`input-textarea ${readOnly ? "input-textarea-readonly" : ""}`}
          />
        </div>
        <div className="button-box">
          <div>
            <button
              onClick={handleResetFocusAndScale}
              aria-label="Reset zoom"
              className="btn btn-ghost"
            >
              Reset
            </button>
            <button onClick={handleMapView} aria-label="Map View" className="btn btn-ghost">
              Map View
            </button>
          </div>
          <button
            onClick={() => {
              addNote();
            }}
            className="btn btn-primary"
            disabled={readOnly}
            title={readOnly ? "Save this VOD to your session to add notes" : undefined}
          >
            {readOnly ? "Read-only" : "+ Add Note"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Notes;
