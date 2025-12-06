import "./App.css";
import { useVideoMetaData } from "./hooks/useVideoMetaData";
import VideoPlayer from "./components/VideoPlayer";
import ResultBox from "./components/Notes";

function App() {
  const metaData = useVideoMetaData();

  return (
    <div className="container">
      <VideoPlayer handleProgress={metaData.handleProgress} />
      <div className="input-container">
        <ResultBox currentTime={metaData.currentTimeRef} />
      </div>
    </div>
  );
}

export default App;
