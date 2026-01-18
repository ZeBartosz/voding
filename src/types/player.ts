import type { Video, VoddingPayload } from "./index";

export interface ReactPlayerRef extends HTMLVideoElement {
  currentTime: number;
  duration: number;
  volume: number;
  getInternalPlayer: () => YouTubeInternalPlayer | null;
}

export interface YouTubeInternalPlayer {
  playVideo: () => void;
  pauseVideo: () => void;
  getPlayerState: () => number;
  api: {
    seekTo: (time: number, units: string) => void;
  };
}

export interface ReactPlayerProgress {
  played: number;
  playedSeconds: number;
  loaded: number;
  loadedSeconds: number;
}

export interface VideoPlayerProps {
  handleProgress: (e: React.SyntheticEvent<HTMLVideoElement>) => void;
  handleTitleChange: (e: React.SyntheticEvent<HTMLVideoElement>) => void;
  playerRef: React.RefObject<HTMLVideoElement | null>;
  video: Video | null;
  handleSubmit: (e: React.FormEvent) => void;
  inputValue: string;
  error: string | null;
  handleSetInputValue: (v: string) => void;
  voddingList: VoddingPayload[];
  deleteVodById: (id: string) => Promise<void>;
  loadWithId: (id: string) => Promise<VoddingPayload | null>;
  loading: boolean;
  setVideo: (v: Video | null) => void;
  onRestoring?: (isRestoring: boolean) => void;
}

export interface MissingURLProps {
  handleSubmit: (e: React.FormEvent) => void;
  inputValue: string;
  handleSetInputValue: (value: string) => void;
  error: string;
  voddingList: VoddingPayload[];
  deleteVodById: (id: string) => Promise<void>;
  loadWithId: (id: string) => Promise<VoddingPayload | null>;
  loading: boolean;
  setVideo: (v: Video | null) => void;
  onRestoring?: (isRestoring: boolean) => void;
}
