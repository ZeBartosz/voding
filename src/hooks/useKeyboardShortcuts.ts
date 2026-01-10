import { useEffect } from "react";

// Current Keybindings:
// App.tsx
//   - Alt-n: Create a new session
//   - Alt-e: Export the current session
// useNotes.ts
//   - Alt-a: Add a new note
//   - Alt-l: Edit the last created note
//   - Ctrl+Alt-d: Delete the last created note
// useLink.ts
//   - Alt-m: Toggle map view

type ShortcutHandler = (e: KeyboardEvent) => void;
type ShortcutMap = Record<string, ShortcutHandler>;

interface ShortcutPattern {
  key: string;
  ctrlKey?: boolean;
  altKey?: boolean;
  shiftKey?: boolean;
  metaKey?: boolean;
}

const parseShortcut = (pattern: string): ShortcutPattern => {
  const parts = pattern.split("+").map((p) => p.trim().toLowerCase());
  const patternKeys: ShortcutPattern = { key: "" };

  for (const part of parts) {
    switch (part) {
      case "ctrl":
      case "control":
        patternKeys.ctrlKey = true;
        break;
      case "alt":
        patternKeys.altKey = true;
        break;
      case "shift":
        patternKeys.shiftKey = true;
        break;
      case "meta":
      case "cmd":
      case "command":
        patternKeys.metaKey = true;
        break;
      default:
        patternKeys.key = part === "space" ? " " : part;
    }
  }

  return patternKeys;
};

const matchesShortcut = (e: KeyboardEvent, pattern: string): boolean => {
  const p = parseShortcut(pattern);
  return (
    e.key.toLowerCase() === p.key.toLowerCase() &&
    e.ctrlKey === Boolean(p.ctrlKey) &&
    e.altKey === Boolean(p.altKey) &&
    e.shiftKey === Boolean(p.shiftKey) &&
    e.metaKey === Boolean(p.metaKey)
  );
};

export const useKeyboardShortcuts = (shortcuts: ShortcutMap, deps: unknown[] = []) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      for (const [pattern, handler] of Object.entries(shortcuts)) {
        if (matchesShortcut(e, pattern)) {
          handler(e);
          break;
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shortcuts, ...deps]);
};
