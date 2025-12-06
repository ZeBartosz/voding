import type { FC } from "react";
import ReactPlayer from "react-player";

const WIDTH = window.innerWidth;
const HEIGHT = window.innerHeight;

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
        error={error || ""}
        handleSetInputValue={handleSetInputValue}
      />
    );

  return (
    <div
      style={{
        overflow: "hidden",
        width: WIDTH / 1.4,
        height: HEIGHT / 1.05,
        position: "relative",
        background: "#000",
      }}
    >
      <ReactPlayer
        ref={playerRef}
        src={url}
        controls
        width="100%"
        height="100%"
        onTimeUpdate={handleProgress}
      />
    </div>
  );
};

interface MissingProps {
  handleSubmit: (e: React.FormEvent) => void;
  inputValue: string;
  handleSetInputValue: (value: string) => void;
  error: string;
}

const MissingURL: FC<MissingProps> = ({ ...link }: MissingProps) => {
  return (
    <div
      className="missing-video"
      style={{
        width: WIDTH / 1.4,
        height: HEIGHT / 1.05,
      }}
    >
      <form onSubmit={link.handleSubmit}>
        <label htmlFor="url-input">Paste VOD link</label>
        <input
          id="url-input"
          type="text"
          value={link.inputValue}
          onChange={(e) => link.handleSetInputValue(e.target.value)}
          placeholder="https://youtu.be/FOatagUO-Z0?si=B7VpCVugvcLB_Jzz"
        />
        <button type="submit">Submit</button>
        {link.error && <p> {link.error}</p>}
      </form>
    </div>
  );
};

export default VideoPlayer;
