// Run: node --test app/api/impostor/_lib/cacheStore.test.mjs   (Node 22.18+, type stripping)
import { test } from "node:test";
import assert from "node:assert/strict";
import { createCacheStore } from "./cacheStore.ts";

/** A key-value cache with optional per-call latency, like a remote cache. */
function fakeKV({ readDelay = 0, writeDelay = 0 } = {}) {
  const data = new Map();
  const wait = (ms) => (ms ? new Promise((r) => setTimeout(r, ms)) : Promise.resolve());
  return {
    data,
    async get(k) {
      await wait(typeof readDelay === "function" ? readDelay() : readDelay);
      return data.has(k) ? data.get(k) : null;
    },
    async set(k, v) {
      await wait(typeof writeDelay === "function" ? writeDelay() : writeDelay);
      data.set(k, v);
    },
  };
}
const room = (version, extra = {}) => ({ code: "ABCD", version, ...extra });
let n = 0;
const opts = { prefix: "room:", ttlMs: 60_000, settleMs: () => 20, newId: () => `w${n++}` };

test("create, read and versioned update", async () => {
  const store = createCacheStore(fakeKV(), opts);
  assert.equal(await store.get("ABCD"), null);
  assert.equal(await store.put(room(1), null), true);
  assert.equal(await store.put(room(1), null), false, "create must not overwrite");
  assert.equal(await store.put(room(2), 1), true);
  assert.equal((await store.get("ABCD")).version, 2);
});

test("a stale instance never overwrites newer state", async () => {
  const store = createCacheStore(fakeKV(), opts);
  await store.put(room(1), null);
  await store.put(room(2, { by: "fresh" }), 1);
  assert.equal(await store.put(room(2, { by: "stale" }), 1), false);
  assert.equal((await store.get("ABCD")).by, "fresh");
});

test("two instances racing on the same version: exactly one wins, loser retries", async () => {
  const kv = fakeKV({ readDelay: () => Math.random() * 5, writeDelay: () => Math.random() * 5 });
  const a = createCacheStore(kv, opts);
  const b = createCacheStore(kv, opts);
  await a.put(room(1, { votes: [] }), null);
  let lost = 0;
  for (let i = 0; i < 40; i++) {
    const base = await a.get("ABCD");
    const [okA, okB] = await Promise.all([
      a.put(room(base.version + 1, { votes: [...base.votes, `a${i}`] }), base.version),
      b.put(room(base.version + 1, { votes: [...base.votes, `b${i}`] }), base.version),
    ]);
    const stored = await a.get("ABCD");
    const winner = stored.votes.at(-1);
    if (okA && okB) lost++;
    if (okA && !okB) assert.equal(winner, `a${i}`);
    if (okB && !okA) assert.equal(winner, `b${i}`);
    for (const [ok, who] of [[okA, "a"], [okB, "b"]]) {
      if (ok) continue;
      const cur = await a.get("ABCD");
      if (cur.votes.includes(`${who}${i}`)) continue;
      assert.equal(await a.put(room(cur.version + 1, { votes: [...cur.votes, `${who}${i}`] }), cur.version), true);
    }
  }
  const final = await a.get("ABCD");
  assert.equal(lost, 0, "both writers believed they won");
  for (let i = 0; i < 40; i++) {
    assert.ok(final.votes.includes(`a${i}`) && final.votes.includes(`b${i}`), `update ${i} lost`);
  }
});

test("garbage in the cache reads as missing", async () => {
  const kv = fakeKV();
  kv.data.set("room:ABCD", "not json");
  const store = createCacheStore(kv, opts);
  assert.equal(await store.get("ABCD"), null);
});
