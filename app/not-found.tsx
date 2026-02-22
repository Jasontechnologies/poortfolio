import Link from 'next/link';

export default function NotFound() {
  return (
    <section className="py-6">
      <article className="card max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#5d6d92]">404</p>
        <h1 className="mt-2 text-3xl font-bold">Page not found</h1>
        <p className="mt-3 text-black/70">
          The page you requested is not available. Use the links below to continue.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link href="/" className="btn-primary">
            Go home
          </Link>
          <Link href="/contact" className="btn-subtle">
            Contact support
          </Link>
        </div>
      </article>
    </section>
  );
}
