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
    handleNoteJump,
  } = useLink();

  return (
    <>
      <div className="container">
        <div className="topbar">
          <div className="brand">
            <div className="brand-badge">V</div>
            <div className="brand-title">
              <div className="title">VOD Review Session</div>
              <div className="subtitle">Competitive Analysis</div>
            </div>
          </div>

          <div className="topbar-right">
            <div className="small">Session Notes</div>
            <div className="notes-pill">0 notes</div>
          </div>
        </div>

        <div className="main">
          <div className="video-column">
            <VideoPlayer
              handleProgress={handleProgress}
              playerRef={playerRef}
              url={url}
              handleSubmit={handleSubmit}
              inputValue={inputValue}
              error={error}
              handleSetInputValue={handleSetInputValue}
            />
          </div>

          <aside className="sidebar">
            <div className="sidebar-header">
              <div className="header-left">
                <div className="h1">Session Notes</div>
                <div className="small">Add your observations</div>
              </div>
              <div className="dot">•</div>
            </div>

            <div className="input-container">
              <ResultBox
                currentTime={currentTimeRef}
                handleNoteJump={handleNoteJump}
                handleMapView={handleMapView}
                handleResetFocusAndScale={handleResetFocusAndScale}
              />
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}

export default App;
