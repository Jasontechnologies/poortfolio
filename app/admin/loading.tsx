export default function AdminLoading() {
  return (
    <section className="space-y-4 py-4">
      <article className="card animate-pulse space-y-3">
        <div className="h-7 w-56 rounded bg-black/10" />
        <div className="h-4 w-72 rounded bg-black/10" />
        <div className="h-4 w-40 rounded bg-black/10" />
      </article>
      <article className="card animate-pulse space-y-3">
        <div className="h-4 w-32 rounded bg-black/10" />
        <div className="h-16 w-full rounded bg-black/10" />
        <div className="h-16 w-full rounded bg-black/10" />
      </article>
    </section>
  );
}
