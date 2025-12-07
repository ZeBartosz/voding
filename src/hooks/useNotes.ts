import { useCallback, useEffect, useRef, useState } from "react";
import type { KeyboardEvent, RefObject } from "react";
import type { Note } from "../types";
import { v4 as uuidv4 } from "uuid";

export const useNotes = (
  currentTimeRef?: RefObject<number>,
  initialNotes?: Note[],
) => {
  const [notes, setNotes] = useState<Note[]>(initialNotes ?? []);
  const [inputValue, setInputValue] = useState<string>("");

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const resultsRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // Accept empty arrays as valid initial notes.
    // Only sync when initialNotes is explicitly provided (not undefined/null).
    if (initialNotes === undefined || initialNotes === null) return;
    setNotes(initialNotes);
  }, [initialNotes]);

  const addNote = useCallback(() => {
    if (!inputValue.trim()) return;

    const timestamp =
      typeof currentTimeRef?.current === "number" ? currentTimeRef.current : 0;

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
  }, [inputValue, currentTimeRef]);

  const deleteNote = useCallback((index: number) => {
    setNotes((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const editNote = useCallback((id: string, newContent: string) => {
    setNotes((prev) =>
      prev.map((n) =>
        n.id === id
          ? { ...n, content: newContent, updatedAt: new Date().toISOString() }
          : n,
      ),
    );
  }, []);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
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
        const newValue =
          inputValue.slice(0, start) + "\n" + inputValue.slice(end);
        setInputValue(newValue);

        requestAnimationFrame(() => {
          el.selectionStart = el.selectionEnd = start + 1;
        });
        return;
      }

      e.preventDefault();
      addNote();
    },
    [inputValue, addNote],
  );

  useEffect(() => {
    const el = resultsRef.current;

    if (!el) return;

    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [notes.length]);

  return {
    notes,
    inputValue,
    setInputValue,
    addNote,
    deleteNote,
    editNote,
    textareaRef,
    resultsRef,
    handleKeyDown,
    setNotes,
  };
};
