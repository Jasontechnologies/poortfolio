export default function ProductsLoading() {
  return (
    <section className="space-y-6 py-6">
      <div className="loading-top-bar rounded-full" />
      <article className="card space-y-3">
        <div className="skeleton h-9 w-64" />
        <div className="skeleton h-5 w-full max-w-2xl" />
        <div className="flex flex-wrap gap-2">
          <div className="skeleton h-8 w-16 rounded-full" />
          <div className="skeleton h-8 w-16 rounded-full" />
          <div className="skeleton h-8 w-28 rounded-full" />
        </div>
      </article>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <article className="card space-y-3">
          <div className="skeleton h-2 w-16" />
          <div className="skeleton h-7 w-36" />
          <div className="skeleton h-4 w-full" />
          <div className="skeleton h-4 w-4/5" />
          <div className="skeleton h-4 w-24" />
        </article>
        <article className="card space-y-3">
          <div className="skeleton h-2 w-16" />
          <div className="skeleton h-7 w-40" />
          <div className="skeleton h-4 w-full" />
          <div className="skeleton h-4 w-5/6" />
          <div className="skeleton h-4 w-20" />
        </article>
        <article className="card space-y-3">
          <div className="skeleton h-2 w-16" />
          <div className="skeleton h-7 w-32" />
          <div className="skeleton h-4 w-full" />
          <div className="skeleton h-4 w-3/4" />
          <div className="skeleton h-4 w-24" />
        </article>
        <article className="card space-y-3">
          <div className="skeleton h-2 w-16" />
          <div className="skeleton h-7 w-44" />
          <div className="skeleton h-4 w-full" />
          <div className="skeleton h-4 w-4/5" />
          <div className="skeleton h-4 w-20" />
        </article>
      </div>
    </section>
  );
}
