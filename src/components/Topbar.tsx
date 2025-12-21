import { memo } from "react";
import type { Video } from "../types";
import Skeleton from "./ui/skeleton";

interface TopbarProps {
  video: Video | null;
  lastSavedAt: string | Date | null;
  exporting: boolean;
  handleExport: () => void;
  handleNewSession: () => void;
  currentTitle: string | null;
}

const Topbar = ({
  video,
  lastSavedAt,
  exporting,
  handleExport,
  handleNewSession,
  currentTitle,
}: TopbarProps) => {
  return (
    <div className="topbar">
      <div className="brand">
        <div
          className="brand-badge"
          onClick={handleNewSession}
          style={{ cursor: "pointer" }}
          title="Start new session"
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              handleNewSession();
            }
          }}
        >
          V
        </div>
        <div className="brand-title">
          <div className="title">
            {currentTitle
              ? (video?.name ?? <Skeleton height={16} />)
              : "VOD Review Session"}
          </div>
          <div className="subtitle">Competitive Analysis</div>
        </div>
      </div>

      {video && (
        <div className="topbar-right">
          {lastSavedAt && (
            <div style={{ fontSize: 12, color: "#666" }}>
              Saved {new Date(lastSavedAt).toLocaleTimeString()}
            </div>
          )}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              marginLeft: 12,
              gap: 12,
            }}
          >
            <button
              disabled={exporting}
              className="btn btn-ghost"
              onClick={handleNewSession}
              type="button"
            >
              New VOD
            </button>
            <button
              onClick={handleExport}
              disabled={exporting}
              className="btn btn-ghost"
              aria-label="Export notes"
              title="Export notes to PDF"
              type="button"
            >
              {exporting ? "Exporting…" : "Export"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default memo<TopbarProps>(Topbar);
