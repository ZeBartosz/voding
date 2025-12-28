import type { Note } from "../types";

/**
 * Compressed note format for URL params
 * We only store timestamp and content to keep URLs shorter
 */
interface CompressedNote {
  t: number; // timestamp
  c: string; // content
}

/**
 * Convert a string to base64 (handles Unicode properly)
 */
function stringToBase64(str: string): string {
  const bytes = new TextEncoder().encode(str);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Convert base64 to string (handles Unicode properly)
 */
function base64ToString(base64: string): string {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new TextDecoder().decode(bytes);
}

/**
 * Encode notes array to a URL-safe base64 string
 */
export function encodeNotesForUrl(notes: Note[]): string {
  if (!notes.length) return "";

  const compressed: CompressedNote[] = notes.map((note) => ({
    t: Math.round(note.timestamp),
    c: note.content,
  }));

  try {
    const json = JSON.stringify(compressed);
    // Use base64url encoding (URL-safe base64)
    const base64 = stringToBase64(json);
    // Make it URL-safe by replacing + with -, / with _, and removing =
    return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  } catch {
    return "";
  }
}

/**
 * Decode notes from URL-safe base64 string
 */
export function decodeNotesFromUrl(encoded: string): Note[] {
  if (!encoded) return [];

  try {
    // Restore standard base64 from URL-safe format
    let base64 = encoded.replace(/-/g, "+").replace(/_/g, "/");
    // Add back padding if needed
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

/**
 * Build a shareable URL with video and notes encoded in hash params
 */
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

  return `${origin}${pathname}#${params.toString()}`;
}

/**
 * Parse hash params from the current URL
 */
export function parseHashParams(): {
  videoUrl: string | null;
  timestamp: number | null;
  notes: Note[];
} {
  const raw = window.location.hash || "";
  if (!raw) {
    return { videoUrl: null, timestamp: null, notes: [] };
  }

  try {
    const hash = raw.replace(/^#/, "");
    const params = new URLSearchParams(hash);

    const v = params.get("v");
    const t = params.get("t");
    const n = params.get("n");

    const videoUrl = v ? decodeURIComponent(v) : null;
    const timestamp = t ? Number(t) : null;
    const notes = n ? decodeNotesFromUrl(n) : [];

    return {
      videoUrl,
      timestamp: Number.isNaN(timestamp) ? null : timestamp,
      notes,
    };
  } catch {
    return { videoUrl: null, timestamp: null, notes: [] };
  }
}

/**
 * Update URL hash with current video and notes without triggering navigation
 */
export function updateUrlHash(videoUrl: string | null, notes: Note[]): void {
  if (!videoUrl) {
    // Clear hash if no video
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

  // Only update if changed to avoid unnecessary history entries
  if (currentHash !== newHash) {
    window.history.replaceState(null, "", `${window.location.pathname}${newHash}`);
  }
}
