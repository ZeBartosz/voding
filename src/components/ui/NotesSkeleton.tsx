import { memo } from "react";
import Skeleton from "./skeleton";
import "../../css/skeleton.css";
import "../../css/Notes.css";

const NotesSkeleton = () => {
  const rows = ["r1", "r2", "r3", "r4"];

  return (
    <>
      <div className="result-list-top">
        <div className="notes-search">
          <Skeleton size="small" width="100%" />
        </div>
        <div className="notes-pill">
          <Skeleton size="small" width="56px" />
        </div>
      </div>

      <div className="result-box">
        {rows.map((id) => (
          <div className="result-card" key={id}>
            <div className="result-card-header">
              <div className="result-meta">
                <Skeleton size="small" width="88px" />
              </div>

              <div className="result-actions-row">
                <Skeleton size="small" width="40px" />
                <Skeleton size="small" width="40px" />
                <Skeleton size="small" width="40px" />
              </div>
            </div>

            <div className="result-content">
              <Skeleton size="large" width="90%" />
            </div>
          </div>
        ))}
      </div>
      <div className="input-box">
        <div className="note-edit-wrap">
          <Skeleton size="large" width="100%" height={84} />
        </div>
        <div className="button-box" style={{ marginTop: 8 }}>
          <div style={{ display: "flex", gap: 8 }}>
            <Skeleton size="small" width="84px" />
            <Skeleton size="small" width="112px" />
          </div>
          <Skeleton size="small" width="84px" />
        </div>
      </div>
    </>
  );
};

export default memo(NotesSkeleton);
