import type { FC } from "react";
import { useLink } from "../hooks/useLink";
import ReactPlayer from "react-player";

const WIDTH = window.innerWidth;
const HEIGHT = window.innerHeight;

const VideoPlayer = ({
  handleProgress,
}: {
  handleProgress: (e: React.SyntheticEvent<HTMLMediaElement>) => void;
}) => {
  const {
    playerRef,
    url,
    handleSubmit,
    inputValue,
    error,
    handleSetInputValue,
    handleMapView,
    handleResetFocusAndScale,
  } = useLink();

  if (url === null)
    return (
      <MissingURL
        {...{ handleSubmit, inputValue, error, handleSetInputValue }}
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

      <div
        style={{
          position: "absolute",
          top: 8,
          right: 8,
          zIndex: 9999,
          display: "flex",
          gap: 8,
        }}
      >
        <button onClick={handleResetFocusAndScale} aria-label="Reset zoom">
          Reset
        </button>

        <button onClick={handleMapView} aria-label="Map View">
          Map View
        </button>
      </div>
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
        {link.error ?? <p> {link.error}</p>}
      </form>
    </div>
  );
};

export default VideoPlayer;
