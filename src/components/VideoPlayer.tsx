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

interface VideoPlayerProps {
  handleProgress: (e: React.SyntheticEvent<HTMLMediaElement>) => void;
  playerRef: React.Ref<HTMLVideoElement>;
  url: string | null;
  handleSubmit: (e: React.FormEvent) => void;
  inputValue: string;
  error: string | null;
  handleSetInputValue: (v: string) => void;
}

const VideoPlayer: FC<VideoPlayerProps> = ({
  handleProgress,
  playerRef,
  url,
  handleSubmit,
  inputValue,
  error,
  handleSetInputValue,
}) => {
  if (url === null)
    return (
      <MissingURL
        handleSubmit={handleSubmit}
        inputValue={inputValue}
        error={error ?? ""}
        handleSetInputValue={handleSetInputValue}
      />
    );

  return (
    <div className="video-player-wrap">
      <MediaController
        style={{
          width: "100%",
          height: "100%",
          aspectRatio: "16/9",
        }}
      >
        <ReactPlayer
          ref={playerRef}
          src={url}
          slot="media"
          controls={false}
          style={{
            width: "100%",
            height: "100%",
          }}
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
}

const MissingURL: FC<MissingProps> = ({
  handleSubmit,
  inputValue,
  handleSetInputValue,
  error,
}) => {
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
    </div>
  );
};

export default VideoPlayer;
