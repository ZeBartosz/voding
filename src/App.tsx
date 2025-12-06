import "./App.css";
import { useVideoMetaData } from "./hooks/useVideoMetaData";
import VideoPlayer from "./components/VideoPlayer";
import ResultBox from "./components/Notes";
import { useLink } from "./hooks/useLink";

function App() {
  const { handleProgress, currentTimeRef } = useVideoMetaData();
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

  return (
    <div className="container">
      <VideoPlayer
        handleProgress={handleProgress}
        playerRef={playerRef}
        url={url}
        handleSubmit={handleSubmit}
        inputValue={inputValue}
        error={error}
        handleSetInputValue={handleSetInputValue}
        handleMapView={handleMapView}
        handleResetFocusAndScale={handleResetFocusAndScale}
      />
      <div className="input-container">
        <ResultBox currentTime={currentTimeRef} />
      </div>
    </div>
  );
}

export default App;
