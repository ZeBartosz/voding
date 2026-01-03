import { memo, useCallback, useEffect, useRef, useState } from "react";
import type { Video } from "../types";
import Skeleton from "./ui/skeleton";
import { removeSharedFromUrl } from "../utils/urlParams";

interface TopbarProps {
  video: Video | null;
  lastSavedAt: string | Date | null;
  exporting: boolean;
  handleExport: () => void;
  handleNewSession: () => void;
  onCopyShareableUrl?: () => Promise<boolean>;
  onSaveShared?: () => Promise<boolean>;
}

const Topbar = ({
  video,
  lastSavedAt,
  exporting,
  handleExport,
  handleNewSession,
  onCopyShareableUrl,
  onSaveShared,
}: TopbarProps) => {
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "error">("idle");
  const [saveStatus, setSaveStatus] = useState<"idle" | "saved" | "error">("idle");

  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, []);

  const handleShare = useCallback(async () => {
    if (!onCopyShareableUrl) return;

    if (copyTimeoutRef.current) {
      clearTimeout(copyTimeoutRef.current);
      copyTimeoutRef.current = null;
    }

    try {
      const success = await onCopyShareableUrl();
      setCopyStatus(success ? "copied" : "error");

      copyTimeoutRef.current = setTimeout(() => {
        setCopyStatus("idle");
        copyTimeoutRef.current = null;
      }, 2000);
    } catch {
      setCopyStatus("error");
      copyTimeoutRef.current = setTimeout(() => {
        setCopyStatus("idle");
        copyTimeoutRef.current = null;
      }, 2000);
    }
  }, [onCopyShareableUrl]);

  const handleSaveShared = useCallback(async () => {
    if (!onSaveShared) return;

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }

    try {
      const success = await onSaveShared();
      setSaveStatus(success ? "saved" : "error");

      saveTimeoutRef.current = setTimeout(() => {
        setSaveStatus("idle");
        saveTimeoutRef.current = null;
      }, 2000);

      return success;
    } catch {
      setSaveStatus("error");
      saveTimeoutRef.current = setTimeout(() => {
        setSaveStatus("idle");
        saveTimeoutRef.current = null;
      }, 2000);
      return false;
    }
  }, [onSaveShared]);

  const getShareButtonText = () => {
    switch (copyStatus) {
      case "copied":
        return "Copied!";
      case "error":
        return "Failed";
      default:
        return "Share";
    }
  };

  const getSaveButtonText = () => {
    switch (saveStatus) {
      case "saved":
        return "Saved!";
      case "error":
        return "Failed";
      default:
        return "Save";
    }
  };

  return (
    <header className="topbar">
      <div className="brand">
        <div
          className="brand-badge"
          onClick={handleNewSession}
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
            {video?.name ? (
              video.name !== "Untitled" ? (
                video.name
              ) : (
                <Skeleton height={16} />
              )
            ) : (
              "VOD Review Session"
            )}
          </div>
          <div className="subtitle">Competitive Analysis</div>
        </div>
      </div>

      {video && (
        <div className="topbar-right">
          {lastSavedAt && (
            <div className="topbar-saved">
              <span className="saved-indicator" />
              Saved {new Date(lastSavedAt).toLocaleTimeString()}
            </div>
          )}
          <div className="topbar-actions">
            <button
              disabled={exporting}
              className="topbar-btn"
              onClick={handleNewSession}
              type="button"
              title="Start a new VOD session"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 5v14M5 12h14" />
              </svg>
              New VOD
            </button>

            <button
              onClick={() => void handleShare()}
              disabled={exporting || copyStatus !== "idle"}
              className={`topbar-btn ${copyStatus === "copied" ? "topbar-btn-success" : ""}`}
              aria-label="Copy shareable link"
              title="Copy shareable link with notes"
              type="button"
            >
              {copyStatus === "copied" ? (
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              ) : (
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="18" cy="5" r="3" />
                  <circle cx="6" cy="12" r="3" />
                  <circle cx="18" cy="19" r="3" />
                  <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                  <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                </svg>
              )}
              {getShareButtonText()}
            </button>

            {onSaveShared && (
              <button
                onClick={() => {
                  void (async () => {
                    const success = await handleSaveShared();
                    if (success) {
                      removeSharedFromUrl();
                    }
                  })();
                }}
                disabled={exporting || saveStatus !== "idle"}
                className={`topbar-btn ${saveStatus === "saved" ? "topbar-btn-success" : ""}`}
                aria-label="Save shared session"
                title="Save shared VOD & notes to your session"
                type="button"
              >
                {saveStatus === "saved" ? (
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : (
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                )}
                {getSaveButtonText()}
              </button>
            )}

            <button
              onClick={handleExport}
              disabled={exporting}
              className="topbar-btn topbar-btn-primary"
              aria-label="Export notes"
              title="Export notes to PDF"
              type="button"
            >
              {exporting ? (
                <>
                  <svg
                    className="topbar-spinner"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                  </svg>
                  Exporting…
                </>
              ) : (
                <>
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
                  </svg>
                  Export
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </header>
  );
};

export default memo<TopbarProps>(Topbar);
