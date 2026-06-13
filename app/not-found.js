import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-md py-16 text-center">
      <p className="text-5xl">🛞</p>
      <h1 className="mt-3 text-2xl font-bold">Page not found</h1>
      <p className="mt-1 text-slate-500">That listing may have rolled away.</p>
      <Link href="/" className="btn-primary mt-4">Back to marketplace</Link>
    </div>
  );
}
