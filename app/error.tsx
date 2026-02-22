'use client';

import { useEffect } from 'react';

export default function ErrorPage({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <section className="py-6">
      <article className="card max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#5d6d92]">500</p>
        <h1 className="mt-2 text-3xl font-bold">Something went wrong</h1>
        <p className="mt-3 text-black/70">
          An unexpected error occurred while loading this page.
        </p>
        <button type="button" className="btn-primary mt-4" onClick={reset}>
          Try again
        </button>
      </article>
    </section>
  );
}
