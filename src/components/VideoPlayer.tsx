import React, { type FC } from "react";
import ReactPlayer from "react-player";
import "media-chrome";
import {
  MediaController,
  MediaControlBar,
  MediaTimeRange,
  MediaTimeDisplay,
  MediaVolumeRange,
  MediaPlayButton,
  MediaSeekBackwardButton,
  MediaSeekForwardButton,
  MediaMuteButton,
} from "media-chrome/react";
import type { Video, VoddingPayload } from "../types";

interface VideoPlayerProps {
  handleProgress: (e: React.SyntheticEvent<HTMLMediaElement>) => void;
  handleTitleChange: (e: React.SyntheticEvent<HTMLMediaElement>) => void;
  playerRef: React.Ref<HTMLVideoElement>;
  video: Video | null;
  handleSubmit: (e: React.FormEvent) => void;
  inputValue: string;
  error: string | null;
  handleSetInputValue: (v: string) => void;
  voddingList: VoddingPayload[];
  deleteVodById: (id: string) => Promise<any>;
  loadWithId: (id: string) => Promise<VoddingPayload | null>;
  loading: boolean;
  setVideo: (v: Video | null) => void;
  onRestoring?: (isRestoring: boolean) => void;
}

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
  if (video === null)
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

  return (
    <div className="video-player-wrap">
      <MediaController className="media-controller">
        <ReactPlayer
          ref={playerRef}
          src={video.url}
          slot="media"
          controls={false}
          className="react-player"
          onLoadedMetadata={handleTitleChange}
          onTimeUpdate={handleProgress}
        />
        <MediaControlBar>
          <MediaPlayButton></MediaPlayButton>
          <MediaSeekBackwardButton></MediaSeekBackwardButton>
          <MediaSeekForwardButton></MediaSeekForwardButton>
          <MediaTimeRange></MediaTimeRange>
          <MediaTimeDisplay showDuration></MediaTimeDisplay>
          <MediaMuteButton></MediaMuteButton>
          <MediaVolumeRange></MediaVolumeRange>
        </MediaControlBar>
      </MediaController>
    </div>
  );
};

interface MissingProps {
  handleSubmit: (e: React.FormEvent) => void;
  inputValue: string;
  handleSetInputValue: (value: string) => void;
  error: string;
  voddingList: VoddingPayload[];
  deleteVodById: (id: string) => Promise<any>;
  loadWithId: (id: string) => Promise<VoddingPayload | null>;
  loading: boolean;
  setVideo: (v: Video | null) => void;
  onRestoring?: (isRestoring: boolean) => void;
}

const MissingURL: FC<MissingProps> = ({
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
      if (v.video?.url) handleSetInputValue(v.video.url);
      if (v.id) await loadWithId(v.id);
      if (v.video) setVideo(v.video);
    } catch (err) {
      console.error("Failed to restore VOD:", err);
    } finally {
      window.setTimeout(() => onRestoring?.(false), 400);
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
        {!loading && (!voddingList || voddingList.length === 0) && (
          <p className="muted">No saved VODs yet.</p>
        )}

        {!loading && voddingList && voddingList.length > 0 && (
          <ul className="vodding-list" aria-label="Saved vodding list">
            {voddingList.map((v) => {
              return (
                <li key={v.id} className="vodding-item">
                  <div className="vodding-meta">
                    <div className="vodding-row">
                      <div className="vodding-title">
                        {v.video?.name || v.video?.url || "Untitled VOD"}
                      </div>

                      <div className="vodding-badges">
                        <span
                          className="notes-badge"
                          title={`${Array.isArray(v.notes) ? v.notes.length : 0} notes`}
                        >
                          📄 {Array.isArray(v.notes) ? v.notes.length : 0}
                        </span>

                        <span
                          className="time-badge"
                          title={
                            v.updatedAt
                              ? new Date(v.updatedAt).toLocaleString()
                              : ""
                          }
                        >
                          {v.updatedAt
                            ? new Date(v.updatedAt).toLocaleString()
                            : ""}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="vodding-actions">
                    <button
                      type="button"
                      className="restore-btn"
                      onClick={() => handleRestore(v)}
                      aria-label={`Restore ${v.id}`}
                      title="Restore VOD and populate notes"
                    >
                      ⟲ Restore
                    </button>

                    <button
                      type="button"
                      className="delete-btn"
                      onClick={() => handleDelete(v.id)}
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
