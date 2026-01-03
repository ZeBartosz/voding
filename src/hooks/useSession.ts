import { useCallback, useEffect, useRef, useState } from "react";
import type { VoddingPayload } from "../types";
import {
  deleteVod,
  getByVideoId,
  getVoddingById,
  getVoddingList,
  saveVod,
} from "../repository/VoddingDb";

export const useSession = (setCurrentTitle: (title: string | null) => void) => {
  const [voddingList, setVoddingList] = useState<VoddingPayload[]>([]);
  const [vodding, _setVodding] = useState<VoddingPayload | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const currentVoddingIdRef = useRef<string | null>(null);
  const currentUpdatedAtRef = useRef<string | null>(null);

  const setVodding = useCallback((value: VoddingPayload | null) => {
    _setVodding(value);
    currentVoddingIdRef.current = value?.id ?? null;
    currentUpdatedAtRef.current = value?.updatedAt ?? null;
  }, []);

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    setVodding(null);
    setVoddingList([]);
    setCurrentTitle(null);

    try {
      const raw = await getVoddingList();
      const data = raw.sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
      setVoddingList(data);
      return data;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
      setVoddingList([]);
      return null;
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadWithId = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);

    try {
      const data = await getVoddingById(id);
      if (
        data &&
        currentVoddingIdRef.current === data.id &&
        currentUpdatedAtRef.current === data.updatedAt
      ) {
        return data;
      }
      _setVodding(data ?? null);
      if (data) {
        currentVoddingIdRef.current = data.id;
        currentUpdatedAtRef.current = data.updatedAt;
        window.localStorage.setItem("current_vodding_id", data.id);
      } else {
        currentVoddingIdRef.current = null;
        currentUpdatedAtRef.current = null;
        window.localStorage.removeItem("current_vodding_id");
      }
      return data;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
      _setVodding(null);
      currentVoddingIdRef.current = null;
      window.localStorage.removeItem("current_vodding_id");
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const loadWithVideoId = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);

    try {
      const data = await getByVideoId(id);
      _setVodding(data ?? null);
      return data;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
      _setVodding(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadAll();

    return () => {
      _setVodding(null);
      setVoddingList([]);
    };
  }, [loadAll]);

  const save = useCallback(async (payload: VoddingPayload): Promise<VoddingPayload> => {
    setLoading(true);
    setError(null);
    try {
      const res = await saveVod(payload);
      _setVodding(res);
      currentVoddingIdRef.current = res.id;
      currentUpdatedAtRef.current = res.updatedAt;
      window.localStorage.setItem("current_vodding_id", res.id);
      return res;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteVodById = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);

    try {
      const maybeVodding = await getVoddingById(id);

      if (!maybeVodding?.video.id) {
        throw new Error(`Cannot delete: vodding record ${id} has no associated video.id`);
      }

      const videoId = maybeVodding.video.id;
      await deleteVod(videoId);
      setVoddingList((prev) => prev.filter((v) => v.video.id !== videoId));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    vodding,
    setVodding,
    loading,
    loadAll,
    loadWithId,
    loadWithVideoId,
    voddingList,
    deleteVodById,
    error,
    save,
  };
};
