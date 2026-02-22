export default function AdminPostsLoading() {
  return (
    <section className="space-y-4 py-4">
      <div className="loading-top-bar rounded-full" />
      <article className="card space-y-3">
        <div className="skeleton h-8 w-56" />
        <div className="skeleton h-4 w-72" />
      </article>
      <div className="grid gap-4 lg:grid-cols-[320px_minmax(0,1fr)]">
        <article className="card space-y-3">
          <div className="skeleton h-6 w-40" />
          <div className="skeleton h-20 w-full" />
          <div className="skeleton h-20 w-full" />
        </article>
        <article className="card space-y-3">
          <div className="skeleton h-6 w-52" />
          <div className="skeleton h-10 w-full" />
          <div className="skeleton h-10 w-full" />
          <div className="skeleton h-56 w-full" />
        </article>
      </div>
    </section>
  );
}

