import { useCallback, useEffect, useRef, useState } from "react";
import type { KeyboardEvent, RefObject } from "react";

interface Note {
  id: number;
  content: string;
  timestamp: number;
}

export const useNotes = (currentTimeRef?: RefObject<number>) => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [inputValue, setInputValue] = useState<string>("");

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const resultsRef = useRef<HTMLDivElement | null>(null);

  const addNote = useCallback(() => {
    if (!inputValue.trim()) return;

    const timestamp =
      typeof currentTimeRef?.current === "number" ? currentTimeRef!.current : 0;

    setNotes((prev: Note[]) => [
      ...prev,
      {
        id: Date.now(),
        content: inputValue,
        timestamp,
      },
    ]);

    setInputValue("");
  }, [inputValue, currentTimeRef]);

  const deleteNote = useCallback((index: number) => {
    setNotes((prev) => prev.filter((_, i) => i !== index));
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

        const start = el.selectionStart ?? inputValue.length;
        const end = el.selectionEnd ?? inputValue.length;
        const newValue =
          inputValue.slice(0, start) + "\n" + inputValue.slice(end);
        setInputValue(newValue);

        requestAnimationFrame(() => {
          if (el) el.selectionStart = el.selectionEnd = start + 1;
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
    textareaRef,
    resultsRef,
    handleKeyDown,
    setNotes,
  };
};
