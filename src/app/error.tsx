"use client";
export default function Error({ reset }: { error: Error; reset: () => void }) {
  return <div className="grid min-h-[60vh] place-items-center px-4 text-center"><div><h1 className="display text-5xl font-bold">Something broke on our side</h1><p className="mt-3 text-mute">Nothing was charged. Try again in a moment.</p><button onClick={reset} className="btn btn-primary mt-6">Try again</button></div></div>;
}
