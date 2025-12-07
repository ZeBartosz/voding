import { useCallback, useEffect, useState } from "react";
import type { VoddingPayload } from "../types";
import {
  deleteVod,
  getVoddingById,
  getVoddingList,
  saveVod,
} from "../repository/VoddingDb";

export const useSession = (setCurrentTitle: (title: string | null) => void) => {
  const [voddingList, setVoddingList] = useState<VoddingPayload[]>([]);
  const [vodding, setVodding] = useState<VoddingPayload | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    setVodding(null);
    setVoddingList([]);
    setCurrentTitle(null);

    try {
      const raw = await getVoddingList();
      const data = (raw ?? []).sort(
        (a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt),
      );
      setVoddingList(data ?? []);
      return data;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
      setVoddingList([]);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const loadWithId = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);

    try {
      const data = await getVoddingById(id);
      setVodding(data ?? null);
      return data;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
      setVodding(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAll();

    return () => {
      setVodding(null);
      setVoddingList([]);
    };
  }, [loadAll]);

  const save = useCallback(
    async (payload: VoddingPayload): Promise<VoddingPayload> => {
      setLoading(true);
      setError(null);
      try {
        const res = await saveVod(payload);
        if (res) setVodding(res);
        return res;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        setError(msg);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const deleteVodById = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);

    try {
      const maybeVodding = await getVoddingById(id);

      if (!maybeVodding?.video?.id) {
        throw new Error(
          `Cannot delete: vodding record ${id} has no associated video.id`,
        );
      }

      const videoId = maybeVodding.video.id;
      await deleteVod(videoId);
      setVoddingList((prev) => prev.filter((v) => v.video?.id !== videoId));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    vodding,
    loading,
    loadAll,
    loadWithId,
    voddingList,
    deleteVodById,
    error,
    save,
  };
};
