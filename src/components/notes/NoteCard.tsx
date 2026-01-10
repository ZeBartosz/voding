import { Clock, Edit, Send, Trash } from "lucide-react";
import type { Note } from "../../types";
import { formatTime } from "../../utils/formatTime";
import { memo } from "react";
import { EditTextarea } from "./InputTextarea";

interface NoteCardProps {
  note: Note;
  isEditing: boolean;
  editingValue: string;
  readOnly: boolean;
  onJump: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onEditValueChange: (value: string) => void;
  onSave: () => void;
  onCancel: () => void;
}

const NoteCard = ({
  note,
  isEditing,
  editingValue,
  readOnly,
  onJump,
  onEdit,
  onDelete,
  onEditValueChange,
  onSave,
  onCancel,
}: NoteCardProps) => {
  return (
    <div className={`result-card ${isEditing ? "editing" : ""}`}>
      <div className="result-card-header">
        <div className="result-meta " onClick={onJump}>
          <span className="timestamp">
            <Clock size={12} className="timestamp-icon" /> {formatTime(note.timestamp)}
          </span>
        </div>

        <div className="result-actions-row">
          <button
            onClick={onJump}
            aria-label="Jump to note"
            className="btn btn-ghost has-tooltip"
            data-tooltip="Jump"
          >
            <Send size={16} />
          </button>

          {!isEditing && !readOnly && (
            <button
              onClick={onEdit}
              aria-label="Edit note"
              className="btn btn-ghost has-tooltip"
              data-tooltip="Edit"
            >
              <Edit size={16} />
            </button>
          )}

          {!readOnly && (
            <button
              onClick={onDelete}
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
          <EditTextarea
            editingValue={editingValue}
            onEditValueChange={onEditValueChange}
            readOnly={readOnly}
            onSave={onSave}
            onCancel={onCancel}
          />
        ) : (
          <div className="note-content">{note.content}</div>
        )}
      </div>
    </div>
  );
};

export default memo(NoteCard);
