import { Keyboard } from "lucide-react";
import { memo, useMemo, useState } from "react";
import { useKeyboardShortcuts } from "../hooks/useKeyboardShortcuts";

const Shortcuts = () => {
  const [showShortcuts, setShowShortcuts] = useState(false);

  const shortcutsBindings = useMemo(
    () => ({
      "alt+s": (e: KeyboardEvent) => {
        e.preventDefault();
        if (showShortcuts) {
          setShowShortcuts(false);
        } else {
          setShowShortcuts(true);
        }
      },
    }),
    [showShortcuts],
  );

  useKeyboardShortcuts(shortcutsBindings);

  return (
    <div
      className="shortcuts-trigger"
      role="button"
      tabIndex={0}
      aria-label="Keyboard shortcuts"
      aria-expanded={showShortcuts}
      aria-haspopup="dialog"
      onClick={() => {
        setShowShortcuts(!showShortcuts);
      }}
      title="Keyboard shortcuts"
    >
      <Keyboard size={16} />
      {showShortcuts && (
        <div
          className="shortcuts-panel"
          role="dialog"
          aria-label="Keyboard shortcuts"
          onClick={(e) => {
            e.stopPropagation();
          }}
        >
          <div className="shortcuts-section">
            <div className="shortcuts-title">Session</div>
            <div className="shortcut-item">
              <kbd>Alt</kbd> + <kbd>N</kbd>
              <span>New session</span>
            </div>
            <div className="shortcut-item">
              <kbd>Alt</kbd> + <kbd>E</kbd>
              <span>Export PDF</span>
            </div>
          </div>

          <div className="shortcuts-section">
            <div className="shortcuts-title">Video</div>
            <div className="shortcut-item">
              <kbd>Space</kbd> / <kbd>K</kbd>
              <span>Play/Pause</span>
            </div>
            <div className="shortcut-item">
              <kbd>J</kbd> / <kbd>L</kbd>
              <span>Seek ± 5s</span>
            </div>
            <div className="shortcut-item">
              <kbd>←</kbd> / <kbd>→</kbd>
              <span>Seek ± 10s</span>
            </div>
            <div className="shortcut-item">
              <kbd>↑</kbd> / <kbd>↓</kbd>
              <span>Volume</span>
            </div>
            <div className="shortcut-item">
              <kbd>Alt</kbd> + <kbd>M</kbd>
              <span>Toggle map</span>
            </div>
          </div>

          <div className="shortcuts-section">
            <div className="shortcuts-title">Notes</div>
            <div className="shortcut-item">
              <kbd>Alt</kbd> + <kbd>A</kbd>
              <span>Add note</span>
            </div>
            <div className="shortcut-item">
              <kbd>Alt</kbd> + <kbd>T</kbd>
              <span>Focus textarea</span>
            </div>
            <div className="shortcut-item">
              <kbd>Alt</kbd> + <kbd>↑/↓</kbd>
              <span>Navigate notes</span>
            </div>
            <div className="shortcut-item">
              <kbd>Alt</kbd> + <kbd>Enter</kbd>
              <span>Jump to note</span>
            </div>
            <div className="shortcut-item">
              <kbd>Alt</kbd> + <kbd>L</kbd>
              <span>Edit selected</span>
            </div>
            <div className="shortcut-item">
              <kbd>Ctrl</kbd> + <kbd>Alt</kbd> + <kbd>L</kbd>
              <span>Edit latest</span>
            </div>
            <div className="shortcut-item">
              <kbd>Ctrl</kbd> + <kbd>Alt</kbd> + <kbd>D</kbd>
              <span>Delete note</span>
            </div>
            <div className="shortcut-item">
              <kbd>Esc</kbd>
              <span>Cancel/Clear</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default memo(Shortcuts);
