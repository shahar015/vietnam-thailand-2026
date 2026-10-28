import "server-only";
import { BlobPreconditionFailedError, get, put } from "@vercel/blob";
import { applyOp } from "./ops";
import { SEED } from "./seed";
import type { OpRequest, TripState } from "./types";

const PATH = "trip/state.json";
const hasBlob = () => Boolean(process.env.BLOB_READ_WRITE_TOKEN);

// Local development without a Blob token keeps changes in memory.
let memory: TripState | null = null;

async function read(): Promise<{ state: TripState; etag?: string }> {
  if (!hasBlob()) return { state: memory ?? SEED };
  const res = await get(PATH, { access: "private", useCache: false });
  if (!res || res.statusCode !== 200) return { state: SEED };
  const text = await new Response(res.stream).text();
  // get() reports a weak ETag (W/"…"); put's ifMatch only matches the strong form.
  return { state: JSON.parse(text) as TripState, etag: res.blob.etag?.replace(/^W\//, "") };
}

export async function loadState(): Promise<TripState> {
  return (await read()).state;
}

export async function commit(req: OpRequest, opts: { admin?: boolean } = {}): Promise<TripState> {
  if (!hasBlob()) {
    memory = applyOp(memory ?? SEED, req, opts);
    return memory;
  }
  for (let attempt = 0; attempt < 6; attempt++) {
    const { state, etag } = await read();
    const next = applyOp(state, req, opts);
    try {
      await put(PATH, JSON.stringify(next), {
        access: "private",
        contentType: "application/json",
        cacheControlMaxAge: 60,
        ...(etag ? { ifMatch: etag } : { allowOverwrite: true }),
      });
      return next;
    } catch (e) {
      if (e instanceof BlobPreconditionFailedError) continue; // someone else saved first; retry on their version
      throw e;
    }
  }
  throw new Error("busy: the state changed on every one of 6 attempts");
}
