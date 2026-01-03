import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { RefObject } from "react";
import type { Note } from "../types";
import { v4 as uuidv4 } from "uuid";
import { formatTime } from "../utils/formatTime";

export const useNotes = (currentTimeRef?: RefObject<number>, initialNotes?: Note[]) => {
  const [notes, setNotes] = useState<Note[]>(initialNotes ?? []);
  const [inputValue, setInputValue] = useState<string>("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState<string>("");
  const [query, setQuery] = useState<string>("");

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

  const addNote = useCallback(() => {
    if (!inputValue.trim()) return;

    const timestamp = typeof currentTimeRef?.current === "number" ? currentTimeRef.current : 0;

    const newNote: Note = {
      id: uuidv4(),
      content: inputValue,
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
  }, [inputValue, currentTimeRef, scrollToBottom]);

  const deleteNote = useCallback((id: string) => {
    setNotes((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const editNote = useCallback((id: string, newContent: string) => {
    setNotes((prev) =>
      prev.map((n) =>
        n.id === id ? { ...n, content: newContent, updatedAt: new Date().toISOString() } : n,
      ),
    );

    setEditingId(null);
    setEditingValue("");
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key !== "Enter") return;

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

      e.preventDefault();
      addNote();
    },
    [inputValue, addNote],
  );

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
  };
};
