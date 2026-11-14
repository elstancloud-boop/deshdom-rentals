import Link from "next/link";
export default function NotFound() {
  return <div className="grid min-h-[60vh] place-items-center px-4 text-center"><div><div className="mono text-sm text-mute">404</div><h1 className="display mt-2 text-6xl font-bold">Not on the shelf</h1><p className="mt-3 text-mute">That page does not exist or has moved.</p><Link href="/browse" className="btn btn-volt mt-6">Browse gear</Link></div></div>;
}
