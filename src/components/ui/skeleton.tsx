import React from "react";
import "../../css/skeleton.css";

interface Props {
  size?: "small" | "large";
  width?: string;
  height?: string | number;
  className?: string;
}

const Skeleton = ({
  size = "large",
  width = "100%",
  height,
  className = "",
}: Props) => {
  const style: React.CSSProperties = { width };
  if (height !== undefined) {
    style.height = height;
  }

  return (
    <div className={`skeleton-container ${className}`}>
      <div className={`skeleton-box ${size}`} style={style} />
    </div>
  );
};

export default Skeleton;
