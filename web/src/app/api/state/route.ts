import { connection } from "next/server";
import { loadState } from "@/lib/store";

export async function GET() {
  await connection();
  const state = await loadState();
  return Response.json(state, { headers: { "cache-control": "no-store" } });
}
