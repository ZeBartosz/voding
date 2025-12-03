import { useCallback, useRef } from "react";

export const useVideoMetaData = () => {
  const currentTimeRef = useRef(0);

  const handleProgress = useCallback(
    (e: React.SyntheticEvent<HTMLMediaElement>) => {
      const el = e.currentTarget as HTMLMediaElement;
      currentTimeRef.current = el.currentTime;
    },
    [],
  );
  return {
    currentTimeRef,
    handleProgress,
  };
};
