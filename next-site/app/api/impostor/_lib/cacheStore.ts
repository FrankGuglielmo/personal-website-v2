// Room store on a plain key-value cache (Vercel Runtime Cache in production).
// The cache has no compare-and-set, so writes are guarded twice: the stored
// version must still be the one we loaded, and after writing we read back our
// write id. If another instance's write landed instead, put() reports a
// conflict and the caller reloads and re-applies its action on newer state.
// No value imports, so `node --test` can load it directly.

export type KV = {
  get(key: string): Promise<unknown>;
  set(key: string, value: unknown, options?: { ttl?: number; name?: string; tags?: string[] }): Promise<void>;
};

type Versioned = { code: string; version: number };
type Entry<R> = { w: string; room: R };

export type CacheStoreOptions = {
  prefix: string;
  ttlMs: number;
  /** Pause before the read-back, so a racing write has time to land. */
  settleMs?: () => number;
  newId?: () => string;
};

export function createCacheStore<R extends Versioned>(kv: KV, opts: CacheStoreOptions) {
  const key = (code: string) => `${opts.prefix}${code}`;
  const settle = opts.settleMs ?? (() => 30 + Math.random() * 40);
  const newId = opts.newId ?? (() => Math.random().toString(36).slice(2) + Date.now().toString(36));

  const read = async (code: string): Promise<Entry<R> | null> => {
    const raw = await kv.get(key(code));
    if (typeof raw !== "string") return null;
    try {
      const entry = JSON.parse(raw) as Entry<R>;
      return entry && entry.room && typeof entry.room.version === "number" ? entry : null;
    } catch {
      return null;
    }
  };

  return {
    async get(code: string): Promise<R | null> {
      return (await read(code))?.room ?? null;
    },
    async put(room: R, expectedVersion: number | null): Promise<boolean> {
      const cur = await read(room.code);
      if ((cur ? cur.room.version : null) !== expectedVersion) return false;
      const w = newId();
      await kv.set(key(room.code), JSON.stringify({ w, room } satisfies Entry<R>), {
        ttl: Math.ceil(opts.ttlMs / 1000),
        name: "impostor-room",
      });
      const ms = settle();
      if (ms > 0) await new Promise((r) => setTimeout(r, ms));
      const back = await read(room.code);
      return !back || back.w === w || back.room.version < room.version;
    },
  };
}
