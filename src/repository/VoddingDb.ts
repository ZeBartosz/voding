import type { IDBPDatabase } from "idb";
import { openDB } from "idb";
import { v4 as uuidV4 } from "uuid";
import type { Vodding, VoddingPayload } from "../types";
import { MAX_VODS } from "../types";

let dbPromise: Promise<IDBPDatabase<Vodding>> | null = null;

export const getDB = (): Promise<IDBPDatabase<Vodding>> => {
  dbPromise ??= openDB<Vodding>("VoddingDB", 1, {
    upgrade(db) {
      const store = db.createObjectStore("vodding", { keyPath: "id" });
      store.createIndex("by-CreatedAt", "createdAt", { unique: false });
      store.createIndex("by-videoId", "video.id", { unique: false });
    },
    blocking() {
      dbPromise = null;
    },
  }).catch((err: unknown) => {
    console.error("Failed to open VoddingDB:", err);
    dbPromise = null;
    throw new Error("Storage unavailable");
  });
  return dbPromise;
};

export const getVoddingList = async (): Promise<VoddingPayload[]> => {
  const db = await getDB();
  const voddingList = await db.getAll("vodding");
  return voddingList;
};

export const getVoddingById = async (id: string): Promise<VoddingPayload | null> => {
  const db = await getDB();
  const vodding = await db.get("vodding", id);
  return vodding ?? null;
};

export const saveVod = async (data: VoddingPayload): Promise<VoddingPayload> => {
  const db = await getDB();
  const videoId = data.video.id;

  const existingVodding = await db.getFromIndex("vodding", "by-videoId", videoId);

  if (existingVodding) {
    const updatedVodding: VoddingPayload = {
      ...existingVodding,
      ...data,
      id: existingVodding.id,
      createdAt: existingVodding.createdAt,
      updatedAt: new Date().toISOString(),
    };

    await db.put("vodding", updatedVodding);
    return updatedVodding;
  } else {
    const currentDBArray = (await db.getAll("vodding")).sort(
      (a, b) => Date.parse(a.updatedAt) - Date.parse(b.updatedAt),
    );

    if (currentDBArray.length > MAX_VODS) {
      const oldestVodding = currentDBArray[0];
      await db.delete("vodding", oldestVodding.id);
    }

    const newVodding: VoddingPayload = {
      ...data,
      id: uuidV4(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await db.put("vodding", newVodding);
    return newVodding;
  }
};

export const deleteVod = async (videoId: string) => {
  const db = await getDB();
  const existingVodding = await db.getFromIndex("vodding", "by-videoId", videoId);

  if (existingVodding) {
    await db.delete("vodding", existingVodding.id);
  }
};
