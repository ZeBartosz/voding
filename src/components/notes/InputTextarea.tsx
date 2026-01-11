import { memo, useCallback, useMemo } from "react";
import { useKeyboardShortcuts } from "../../hooks/useKeyboardShortcuts";

export const InputArea = memo(
  ({
    textareaRef,
    inputValue,
    setInputValue,
    handleKeyDown,
    readOnly,
    addNote,
    handleResetFocusAndScale,
    handleMapView,
  }: {
    textareaRef: React.RefObject<HTMLTextAreaElement | null>;
    inputValue: string;
    setInputValue: React.Dispatch<React.SetStateAction<string>>;
    handleKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
    readOnly: boolean;
    addNote: () => void;
    handleResetFocusAndScale: (e: React.SyntheticEvent) => void;
    handleMapView: (e: React.SyntheticEvent) => void;
  }) => {
    const shortcutsBindings = useMemo(
      () => ({
        "alt+t": (e: KeyboardEvent) => {
          e.preventDefault();
          textareaRef.current?.focus();
        },
      }),
      [textareaRef],
    );

    useKeyboardShortcuts(shortcutsBindings);

    return (
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
    );
  },
);

export const EditTextarea = memo(
  ({
    editingValue,
    onEditValueChange,
    readOnly,
    onSave,
    onCancel,
  }: {
    editingValue: string;
    onEditValueChange: (value: string) => void;
    readOnly: boolean;
    onSave: () => void;
    onCancel: () => void;
  }) => {
    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          onSave();
        } else if (e.key === "Escape") {
          e.preventDefault();
          onCancel();
        }
      },
      [onSave, onCancel],
    );

    return (
      <div className="note-edit-wrap">
        <textarea
          autoFocus
          className="note-edit-textarea"
          value={editingValue}
          readOnly={readOnly}
          onChange={(e) => {
            onEditValueChange(e.target.value);
          }}
          onKeyDown={handleKeyDown}
        />
        <div className="note-edit-actions">
          <button
            onClick={onSave}
            className="btn btn-primary"
            disabled={readOnly}
            title={readOnly ? "Disabled in read-only view" : undefined}
          >
            Save
          </button>
          <button onClick={onCancel} className="btn btn-ghost">
            Cancel
          </button>
        </div>
      </div>
    );
  },
);
