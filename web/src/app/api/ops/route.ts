import { OpError } from "@/lib/ops";
import { commit } from "@/lib/store";
import type { OpRequest } from "@/lib/types";

export async function POST(request: Request) {
  let body: OpRequest;
  try {
    body = (await request.json()) as OpRequest;
  } catch {
    return Response.json({ error: "הבקשה לא תקינה" }, { status: 400 });
  }
  const token = process.env.RESEARCH_TOKEN;
  const admin = Boolean(token) && request.headers.get("x-research-token") === token;
  try {
    const state = await commit(body, { admin });
    return Response.json(state, { headers: { "cache-control": "no-store" } });
  } catch (e) {
    if (e instanceof OpError) return Response.json({ error: e.message }, { status: 400 });
    console.error(e);
    return Response.json({ error: "השמירה נכשלה. נסו שוב." }, { status: 500 });
  }
}
