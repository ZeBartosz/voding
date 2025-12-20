import { memo } from "react";

type TopbarProps = {
  video: any;
  lastSavedAt: string | Date | null;
  exporting: boolean;
  handleExport: () => void;
  handleNewSession: () => void;
  savedStyle?: React.CSSProperties;
  rightControlsStyle?: React.CSSProperties;
};

const Topbar = ({
  video,
  lastSavedAt,
  exporting,
  handleExport,
  handleNewSession,
  savedStyle,
  rightControlsStyle,
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
          <div className="title">{video?.name ?? "VOD Review Session"}</div>
          <div className="subtitle">Competitive Analysis</div>
        </div>
      </div>

      {video && (
        <div className="topbar-right">
          {lastSavedAt && (
            <div style={savedStyle}>
              Saved {new Date(lastSavedAt).toLocaleTimeString()}
            </div>
          )}
          <div style={rightControlsStyle}>
            {video && (
              <button
                disabled={exporting}
                className="btn btn-ghost"
                onClick={handleNewSession}
                type="button"
              >
                New VOD
              </button>
            )}
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
