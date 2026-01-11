import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { RefObject } from "react";
import type { Note } from "../types";
import { v4 as uuidv4 } from "uuid";
import { formatTime } from "../utils/formatTime";
import { useKeyboardShortcuts } from "./useKeyboardShortcuts";

export const useNotes = (
  currentTimeRef?: RefObject<number>,
  initialNotes?: Note[],
  onJumpToNote?: (time: number) => void,
) => {
  const [notes, setNotes] = useState<Note[]>(initialNotes ?? []);
  const [inputValue, setInputValue] = useState<string>("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState<string>("");
  const [query, setQuery] = useState<string>("");
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const resultsRef = useRef<HTMLDivElement | null>(null);
  const scrollRef = useRef<number | null>(null);

  useEffect(() => {
    if (!initialNotes) return;
    requestAnimationFrame(() => {
      setNotes(initialNotes);
    });
  }, [initialNotes]);

  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) cancelAnimationFrame(scrollRef.current);

    scrollRef.current = requestAnimationFrame(() => {
      const el = resultsRef.current;
      if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
      scrollRef.current = null;
    });
  }, []);

  useEffect(() => {
    scrollToBottom();
    return () => {
      if (scrollRef.current) cancelAnimationFrame(scrollRef.current);
    };
  }, [notes.length, scrollToBottom]);

  const filtered = useMemo(() => {
    if (!query) return notes;
    const q = query.toLowerCase().trim();
    return notes.filter(
      (n) => n.content.toLowerCase().includes(q) || formatTime(n.timestamp).includes(q),
    );
  }, [notes, query]);

  const addNote = useCallback(
    (value?: string, force?: boolean) => {
      const content = value ?? inputValue;
      if (!content.trim() && !force) return;

      const timestamp = typeof currentTimeRef?.current === "number" ? currentTimeRef.current : 0;

      const newNote: Note = {
        id: uuidv4(),
        content,
        timestamp,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      setNotes((prev: Note[]) => {
        const next = [...prev, newNote];
        return next;
      });

      setInputValue("");
      scrollToBottom();
    },
    [inputValue, currentTimeRef, scrollToBottom],
  );

  const deleteNote = useCallback((id: string) => {
    setNotes((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const deleteLatestNote = useCallback(() => {
    if (notes.length === 0) return;
    const latestNote = notes.reduce((prev, curr) =>
      prev.createdAt > curr.createdAt ? prev : curr,
    );

    deleteNote(latestNote.id);
  }, [notes, deleteNote]);

  const editNote = useCallback((id: string, newContent: string) => {
    setNotes((prev) =>
      prev.map((n) =>
        n.id === id ? { ...n, content: newContent, updatedAt: new Date().toISOString() } : n,
      ),
    );

    setEditingId(null);
    setEditingValue("");
  }, []);

  const editLatestNote = useCallback(() => {
    if (notes.length === 0) return;
    const latestNote = notes.reduce((prev, curr) =>
      prev.createdAt > curr.createdAt ? prev : curr,
    );

    setEditingId(latestNote.id);
    setEditingValue(latestNote.content);
  }, [notes]);

  const navigateNotes = useCallback(
    (direction: "up" | "down") => {
      const list = filtered;
      if (list.length === 0) return;

      const currentIndex = selectedNoteId ? list.findIndex((n) => n.id === selectedNoteId) : -1;

      let newIndex: number;
      if (direction === "down") {
        newIndex = currentIndex + 1 >= list.length ? 0 : currentIndex + 1;
      } else {
        newIndex = currentIndex - 1 < 0 ? list.length - 1 : currentIndex - 1;
      }

      const newNote = list[newIndex];
      setSelectedNoteId(newNote.id);

      requestAnimationFrame(() => {
        const resultsEl = resultsRef.current;
        if (!resultsEl) return;

        const noteEl = resultsEl.querySelector(`[data-note-id="${newNote.id}"]`);
        if (!noteEl) return;

        noteEl.scrollIntoView({ behavior: "smooth", block: "center" });
      });
    },
    [filtered, selectedNoteId],
  );

  const jumpToSelectedNote = useCallback(() => {
    if (!selectedNoteId || !onJumpToNote) return;
    const note = filtered.find((n) => n.id === selectedNoteId);
    if (note) {
      onJumpToNote(note.timestamp);
    }
  }, [selectedNoteId, filtered, onJumpToNote]);

  const handleEscape = useCallback(() => {
    setEditingId(null);
    setEditingValue("");
    setQuery("");
    setSelectedNoteId(null);
  }, []);

  const editSelectedNote = useCallback(() => {
    if (!selectedNoteId) return;
    const note = filtered.find((n) => n.id === selectedNoteId);
    if (note) {
      setEditingId(note.id);
      setEditingValue(note.content);
    }
  }, [selectedNoteId, filtered]);

  const deleteSelectedNote = useCallback(() => {
    if (!selectedNoteId) return;
    deleteNote(selectedNoteId);
    setSelectedNoteId(null);
  }, [selectedNoteId, deleteNote]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key !== "Enter" && e.key !== "Escape") return;

      if (e.shiftKey || e.metaKey) {
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

      if (e.key === "Escape") {
        e.preventDefault();
        const el = textareaRef.current;
        if (el) {
          el.blur();
        }
        return;
      }

      e.preventDefault();
      addNote();
    },
    [inputValue, addNote],
  );

  const shortcutsBindings = useMemo(
    () => ({
      "alt+a": (e: KeyboardEvent) => {
        if (!currentTimeRef) return;
        e.preventDefault();
        addNote(undefined, true);
      },
      "alt+l": (e: KeyboardEvent) => {
        e.preventDefault();
        if (selectedNoteId) {
          editSelectedNote();
        }
      },
      "ctrl+alt+l": (e: KeyboardEvent) => {
        if (!currentTimeRef) return;
        e.preventDefault();
        editLatestNote();
      },
      "ctrl+alt+d": (e: KeyboardEvent) => {
        e.preventDefault();
        if (selectedNoteId) {
          deleteSelectedNote();
        } else if (currentTimeRef) {
          deleteLatestNote();
        }
      },
      "alt+arrowup": (e: KeyboardEvent) => {
        e.preventDefault();
        navigateNotes("up");
      },
      "alt+arrowdown": (e: KeyboardEvent) => {
        e.preventDefault();
        navigateNotes("down");
      },
      "alt+enter": (e: KeyboardEvent) => {
        e.preventDefault();
        jumpToSelectedNote();
      },
      escape: () => {
        handleEscape();
      },
    }),
    [
      addNote,
      currentTimeRef,
      selectedNoteId,
      deleteLatestNote,
      deleteSelectedNote,
      handleEscape,
      navigateNotes,
      editLatestNote,
      jumpToSelectedNote,
      editSelectedNote,
    ],
  );

  useKeyboardShortcuts(shortcutsBindings);

  return {
    items: notes,
    setNotes,
    addNote,
    editNote,
    inputValue,
    setInputValue,
    editingId,
    setEditingId,
    editingValue,
    setEditingValue,
    query,
    setQuery,
    deleteNote,
    textareaRef,
    resultsRef,
    handleKeyDown,
    filtered,
    selectedNoteId,
    setSelectedNoteId,
  };
};
