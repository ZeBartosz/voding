import type { Note } from "../types";

interface CompressedNote {
  t: number;
  c: string;
}

function stringToBase64(str: string): string {
  const bytes = new TextEncoder().encode(str);
  let binary = "";

  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary);
}

function base64ToString(base64: string): string {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new TextDecoder().decode(bytes);
}

export function encodeNotesForUrl(notes: Note[]): string {
  if (!notes.length) return "";

  const compressed: CompressedNote[] = notes.map((note) => ({
    t: Math.floor(note.timestamp),
    c: note.content,
  }));

  try {
    const json = JSON.stringify(compressed);
    const base64 = stringToBase64(json);
    return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  } catch {
    return "";
  }
}

export function decodeNotesFromUrl(encoded: string): Note[] {
  if (!encoded) return [];

  try {
    let base64 = encoded.replace(/-/g, "+").replace(/_/g, "/");
    while (base64.length % 4) {
      base64 += "=";
    }

    const json = base64ToString(base64);
    const compressed: CompressedNote[] = JSON.parse(json) as CompressedNote[];

    if (!Array.isArray(compressed)) return [];

    const now = new Date().toISOString();

    return compressed.map((c, index) => ({
      id: `url-note-${String(index)}-${String(c.t)}`,
      timestamp: typeof c.t === "number" ? c.t : 0,
      content: typeof c.c === "string" ? c.c : "",
      createdAt: now,
      updatedAt: now,
    }));
  } catch {
    return [];
  }
}

export function buildShareableUrl(videoUrl: string, notes: Note[]): string {
  const { origin, pathname } = window.location;
  const params = new URLSearchParams();

  params.set("v", encodeURIComponent(videoUrl));

  if (notes.length > 0) {
    const encodedNotes = encodeNotesForUrl(notes);
    if (encodedNotes) {
      params.set("n", encodedNotes);
    }
  }

  params.set("s", "shared");

  return `${origin}${pathname}#${params.toString()}`;
}

export function parseHashParams(): {
  videoUrl: string | null;
  notes: Note[];
  shared: boolean;
} {
  const raw = window.location.hash || "";
  if (!raw) {
    return { videoUrl: null, notes: [], shared: false };
  }

  try {
    const hash = raw.replace(/^#/, "");
    const params = new URLSearchParams(hash);

    const v = params.get("v");
    const n = params.get("n");
    const s = params.get("s");

    const videoUrl = v ? decodeURIComponent(v) : null;
    const notes = n ? decodeNotesFromUrl(n) : [];
    const shared = s ? true : false;

    return {
      videoUrl,
      notes,
      shared,
    };
  } catch {
    return { videoUrl: null, notes: [], shared: false };
  }
}

export function updateUrlHash(videoUrl: string | null, notes: Note[]): void {
  if (!videoUrl) {
    if (window.location.hash) {
      window.history.replaceState(null, "", window.location.pathname);
    }
    return;
  }

  const params = new URLSearchParams();
  params.set("v", encodeURIComponent(videoUrl));

  if (notes.length > 0) {
    const encodedNotes = encodeNotesForUrl(notes);
    if (encodedNotes) {
      params.set("n", encodedNotes);
    }
  }

  const newHash = `#${params.toString()}`;
  const currentHash = window.location.hash;

  if (currentHash !== newHash) {
    window.history.replaceState(null, "", `${window.location.pathname}${newHash}`);
  }
}

export function removeSharedFromUrl(): void {
  const params = new URLSearchParams();
  params.delete("s");

  const newHash = `#${params.toString()}`;
  const currentHash = window.location.hash;

  if (currentHash !== newHash) {
    window.history.replaceState(null, "", `${window.location.pathname}${newHash}`);
  }
}

export const cleanVideoParams = () => {
  const { origin, pathname, search, hash } = window.location;
  const searchParams = new URLSearchParams(search.startsWith("?") ? search.slice(1) : "");
  searchParams.delete("v");
  searchParams.delete("n");
  searchParams.delete("s");
  const newSearch = searchParams.toString() ? `?${searchParams.toString()}` : "";

  let newHash = "";
  if (hash && hash.length > 1) {
    const hashRaw = hash.replace(/^#/, "");
    if (hashRaw.includes("=") || hashRaw.includes("&")) {
      const hashParams = new URLSearchParams(hashRaw);
      hashParams.delete("v");
      hashParams.delete("n");
      hashParams.delete("s");
      const hashStr = hashParams.toString();
      if (hashStr) {
        newHash = `#${hashStr}`;
      }
    } else {
      newHash = `#${hashRaw}`;
    }
  }

  return `${origin}${pathname}${newSearch}${newHash}`;
};
