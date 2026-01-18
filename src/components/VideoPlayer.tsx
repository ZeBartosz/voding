import { type FC, useCallback, useEffect, useRef, useState } from "react";
import ReactPlayer from "react-player";
import type { VoddingPayload } from "../types";
import type { VideoPlayerProps, MissingURLProps } from "../types/player";

const VideoPlayer: FC<VideoPlayerProps> = ({
  handleProgress,
  handleTitleChange,
  playerRef,
  video,
  handleSubmit,
  inputValue,
  error,
  handleSetInputValue,
  voddingList,
  deleteVodById,
  loadWithId,
  loading,
  setVideo,
  onRestoring,
}) => {
  const [embedError, setEmbedError] = useState(false);
  const [playerKey, setPlayerKey] = useState(0);
  const [copied, setCopied] = useState(false);
  const copyTimeout = useRef<number | null>(null);

  useEffect(() => {
    requestAnimationFrame(() => {
      setEmbedError(false);
    });
  }, [video?.url]);

  useEffect(() => {
    return () => {
      if (copyTimeout.current) {
        clearTimeout(copyTimeout.current);
      }
    };
  }, []);

  const handleCopy = useCallback(async (text: string) => {
    try {
      const clip = (
        navigator as unknown as {
          clipboard?: { writeText?: (s: string) => Promise<void> };
        }
      ).clipboard;
      if (clip && typeof clip.writeText === "function") {
        await clip.writeText(text);
        setCopied(true);

        if (copyTimeout.current) clearTimeout(copyTimeout.current);

        copyTimeout.current = setTimeout(() => {
          setCopied(false);
          copyTimeout.current = null;
        }, 2000);
        return;
      }
    } catch {
      //
    }
    window.prompt("Copy this link:", text);
  }, []);

  const handleRetry = useCallback(() => {
    setEmbedError(false);
    setPlayerKey((k) => k + 1);
  }, []);

  const handlePlayerClick = useCallback(() => {
    setTimeout(() => {
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
    }, 0);
  }, []);

  if (video === null) {
    return (
      <MissingURL
        handleSubmit={handleSubmit}
        inputValue={inputValue}
        error={error ?? ""}
        handleSetInputValue={handleSetInputValue}
        voddingList={voddingList}
        deleteVodById={deleteVodById}
        loadWithId={loadWithId}
        loading={loading}
        setVideo={setVideo}
        onRestoring={onRestoring}
      />
    );
  }

  if (embedError) {
    return (
      <div
        className="video-player-wrap video-unavailable"
        role="region"
        aria-label="Video unavailable"
      >
        <div className="embed-unavailable-card" role="alert">
          <div className="embed-unavailable-icon" aria-hidden>
            <div
              style={{
                width: 88,
                height: 88,
                borderRadius: 999,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                background: "rgba(255,255,255,0.02)",
                border: "1px solid rgba(255,255,255,0.03)",
                marginBottom: 12,
              }}
            >
              <svg
                width="48"
                height="48"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden
              >
                <circle
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="rgba(140,140,140,0.9)"
                  strokeWidth="1.2"
                  fill="transparent"
                />
                <path
                  d="M12 7.5v6"
                  stroke="rgba(180,180,180,0.95)"
                  strokeWidth="1.4"
                  strokeLinecap="round"
                />
                <circle cx="12" cy="16.5" r="0.85" fill="rgba(180,180,180,0.95)" />
              </svg>
            </div>
          </div>

          <h2 className="embed-unavailable-title">Embedding disabled for this video</h2>

          <p className="embed-unavailable-desc">
            The video can still be watched on YouTube, but embedding has been blocked or the player
            configuration prevents playback inside this app.
          </p>

          <div className="embed-unavailable-actions" role="group" aria-label="Embed actions">
            <a
              className="btn btn-primary"
              href={video.url}
              target="_blank"
              rel="noopener noreferrer"
              role="button"
            >
              Watch on YouTube
            </a>

            <button
              type="button"
              className="btn"
              onClick={() => {
                void handleCopy(video.url);
              }}
              aria-label="Copy video link"
            >
              {copied ? "Copied!" : "Copy link"}
            </button>

            <button type="button" className="btn btn-ghost" onClick={handleRetry}>
              Retry embed
            </button>
          </div>

          <hr
            aria-hidden
            style={{
              border: "none",
              borderTop: "1px solid rgba(255,255,255,0.04)",
              margin: "16px 0",
            }}
          />

          <div className="embed-unavailable-help">
            <small>
              If you own this video, go to YouTube Studio → Content → More options and enable "Allow
              embedding" to play this video inside third-party sites.
            </small>

            <small>
              Note: embedding can also be blocked for reasons beyond the uploader's "Allow
              embedding" setting — for example copyright/ Content ID claims, age or region
              restrictions, privacy settings, or other policy-related blocks. If you aren't the
              owner of the video, try opening it on YouTube to see more details about the
              restriction.
            </small>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="video-player-wrap" onClick={handlePlayerClick}>
      <ReactPlayer
        key={playerKey}
        ref={playerRef}
        src={video.url}
        controls={true}
        className="react-player"
        config={{
          youtube: {
            disablekb: 1,
          },
        }}
        onPlay={handlePlayerClick}
        onPause={handlePlayerClick}
        onLoadedMetadata={handleTitleChange}
        onProgress={handleProgress}
        onError={() => {
          setEmbedError(true);
        }}
      />
    </div>
  );
};

const MissingURL: FC<MissingURLProps> = ({
  handleSubmit,
  inputValue,
  handleSetInputValue,
  error,
  voddingList,
  deleteVodById,
  loadWithId,
  loading,
  setVideo,
  onRestoring,
}) => {
  const handleRestore = async (v: VoddingPayload) => {
    onRestoring?.(true);

    try {
      if (v.video.url) handleSetInputValue(v.video.url);
      if (v.id) await loadWithId(v.id);
      setVideo(v.video);
    } catch (err) {
      console.error("Failed to restore VOD:", err);
    } finally {
      setTimeout(() => onRestoring?.(false), 400);
    }
  };

  const handleDelete = async (id?: string) => {
    if (!id) return;
    try {
      await deleteVodById(id);
    } catch (err) {
      console.error("Failed to delete VOD:", err);
    }
  };

  return (
    <div className="missing-video">
      <form onSubmit={handleSubmit}>
        <label htmlFor="url-input">Paste VOD link</label>
        <div>
          <input
            id="url-input"
            type="text"
            value={inputValue}
            onChange={(e) => {
              handleSetInputValue(e.target.value);
            }}
            placeholder="https://youtu.be/FOatagUO-Z0?si=B7VpCVugvcLB_Jzz"
          />
          <button type="submit">Submit</button>
        </div>

        {error && <p className="form-error">{error}</p>}
      </form>

      <div className="vodding-list-wrap">
        <h4>Saved VODs</h4>
        {loading && <p>Loading saved VODs…</p>}
        {!loading && voddingList.length === 0 && <p className="muted">No saved VODs yet.</p>}

        {!loading && voddingList.length > 0 && (
          <ul className="vodding-list" aria-label="Saved vodding list">
            {voddingList.map((v) => {
              const title = v.video.name || v.video.url || "Untitled VOD";
              return (
                <li
                  key={v.id}
                  className="vodding-item"
                  onClick={() => {
                    void handleRestore(v);
                  }}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      void handleRestore(v);
                    }
                  }}
                  title={title}
                  aria-label={`Restore ${title}`}
                >
                  <div className="vodding-meta">
                    <div className="vodding-row">
                      <div className="vodding-title">{title}</div>

                      <div className="vodding-badges">
                        <span
                          className="notes-badge"
                          title={`${String(Array.isArray(v.notes) ? v.notes.length : 0)} notes`}
                        >
                          📄 {Array.isArray(v.notes) ? v.notes.length : 0}
                        </span>

                        <span
                          className="time-badge"
                          title={v.updatedAt ? new Date(v.updatedAt).toLocaleString() : ""}
                        >
                          {v.updatedAt ? new Date(v.updatedAt).toLocaleString() : ""}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="vodding-actions">
                    <button
                      type="button"
                      className="delete-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        void handleDelete(v.id);
                      }}
                      aria-label={`Delete ${v.id}`}
                      title="Delete saved VOD"
                    >
                      🗑
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
};

export default VideoPlayer;
