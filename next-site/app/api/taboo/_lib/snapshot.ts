// Encrypted room snapshots that phones hold so any server instance (or a new
// deployment) can rebuild a room it has never seen. Only `node:crypto` and type
// imports, so this runs under `node --test` (see engine.test.mjs).
import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import type { Room } from "./engine";

type Env = Record<string, string | undefined>;

/**
 * Keys must outlive a single deployment: production redeploys on every merge,
 * and phones mid-game still hold snapshots sealed by the previous one. The first
 * key seals; all keys are tried when opening.
 */
export function snapshotKeys(env: Env): Buffer[] {
  const stableId = env.VERCEL_PROJECT_ID || env.VERCEL_GIT_REPO_ID || env.VERCEL_PROJECT_PRODUCTION_URL || "local";
  const seeds = [
    env.TABOO_SECRET ? `secret:${env.TABOO_SECRET}` : null,
    `taboo:stable:${stableId}`,
    `taboo:${env.VERCEL_DEPLOYMENT_ID ?? ""}:${env.VERCEL_URL ?? "local"}`,
  ].filter((s): s is string => !!s);
  return seeds.map((s) => createHash("sha256").update(s).digest());
}

export function sealRoom(room: Room, keys: Buffer[]): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", keys[0], iv);
  const body = Buffer.concat([cipher.update(JSON.stringify(room), "utf8"), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), body]).toString("base64url");
}

export function openRoom(snapshot: unknown, code: string, keys: Buffer[]): Room | null {
  if (typeof snapshot !== "string" || snapshot.length > 200_000) return null;
  const buf = Buffer.from(snapshot, "base64url");
  if (buf.length < 29) return null;
  for (const key of keys) {
    try {
      const decipher = createDecipheriv("aes-256-gcm", key, buf.subarray(0, 12));
      decipher.setAuthTag(buf.subarray(12, 28));
      const json = Buffer.concat([decipher.update(buf.subarray(28)), decipher.final()]).toString("utf8");
      const room = JSON.parse(json) as Room;
      return room.code === code ? room : null;
    } catch {}
  }
  return null;
}
