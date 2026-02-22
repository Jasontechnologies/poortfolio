export default function BlogLoading() {
  return (
    <section className="space-y-5 py-4">
      <div className="loading-top-bar rounded-full" />
      <div className="skeleton h-5 w-28" />
      <div className="skeleton h-10 w-48" />

      <div className="grid gap-3 md:grid-cols-2">
        <article className="card space-y-3">
          <div className="skeleton h-8 w-3/4" />
          <div className="skeleton h-4 w-full" />
          <div className="skeleton h-4 w-4/5" />
          <div className="skeleton h-3 w-44" />
        </article>
        <article className="card space-y-3">
          <div className="skeleton h-8 w-2/3" />
          <div className="skeleton h-4 w-full" />
          <div className="skeleton h-4 w-3/4" />
          <div className="skeleton h-3 w-36" />
        </article>
      </div>
    </section>
  );
}
