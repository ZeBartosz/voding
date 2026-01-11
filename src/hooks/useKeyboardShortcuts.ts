import { useEffect } from "react";

// Current Keybindings:
// App.tsx
//   - Alt-n: Create a new session
//   - Alt-e: Export the current session
// useNotes.ts (Note Navigation)
//   - Alt+ArrowUp: Navigate up in note list
//   - Alt+ArrowDown: Navigate down in note list
//   - Alt+Enter: Jump to selected note's timestamp
//   - Alt+l: Edit the selected note (when navigating)
//   - Ctrl+Alt+l: Edit the last created note
//   - Ctrl+Alt+d: Delete selected note (when navigating) or last note
//   - Escape: Cancel editing, clear search, deselect note
//   - Alt-a: Add a new note
// useLink.ts (Video Playback)
//   - Space / k: Play/pause
//   - j: Seek -5s
//   - l: Seek +5s
//   - ArrowLeft: Seek -10s
//   - ArrowRight: Seek +10s
//   - ArrowUp: Volume up 10%
//   - ArrowDown: Volume down 10%
//   - Alt-m: Toggle map view
// Shortcut.tsx
//   - Alt-s: Show keyboard shortcuts
// InputTextarea.tsx
//   - Alt+t: Focus on textarea

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

export const useKeyboardShortcuts = (shortcuts: ShortcutMap) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) {
        return;
      }
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
  }, [shortcuts]);
};
