import type { DBSchema } from "idb";

export interface Note {
  id: string;
  timestamp: number;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface Video {
  id: string;
  url: string;
  name: string;
  addedAt: string;
  provider?: string;
}

export interface VoddingPayload {
  id: string;
  createdAt: string;
  updatedAt: string;
  video: Video;
  notes: Note[];
}

export interface Vodding extends DBSchema {
  vodding: {
    key: string;
    value: {
      id: string;
      createdAt: string;
      updatedAt: string;
      video: Video;
      notes: Note[];
    };
    indexes: {
      "by-CreatedAt": string;
      "by-videoId": string;
    };
  };
}

export const MAX_VODS = 6;
