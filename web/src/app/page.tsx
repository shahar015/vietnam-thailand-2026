import { Suspense } from "react";
import { connection } from "next/server";
import { TripApp } from "@/components/TripApp";
import { loadState } from "@/lib/store";

async function Trip() {
  await connection(); // always read the latest shared state
  const state = await loadState();
  return <TripApp initial={state} />;
}

export default function Page() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-xl px-4 pt-16"><div className="h-9 w-56 rounded-lg bg-fill" /><div className="mt-8 h-64 rounded-[14px] bg-cell" /></div>}>
      <Trip />
    </Suspense>
  );
}
