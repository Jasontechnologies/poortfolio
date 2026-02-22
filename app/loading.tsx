export default function HomeLoading() {
  return (
    <section className="space-y-10 py-4">
      <div className="loading-top-bar rounded-full" />
      <article className="hero-shell space-y-5">
        <div className="skeleton h-6 w-40 rounded-full" />
        <div className="skeleton h-12 w-full max-w-3xl" />
        <div className="skeleton h-12 w-full max-w-2xl" />
        <div className="flex gap-3">
          <div className="skeleton h-10 w-40 rounded-full" />
          <div className="skeleton h-10 w-44 rounded-full" />
        </div>
        <div className="grid gap-2 md:grid-cols-4">
          <div className="skeleton h-7 w-full rounded-full" />
          <div className="skeleton h-7 w-full rounded-full" />
          <div className="skeleton h-7 w-full rounded-full" />
          <div className="skeleton h-7 w-full rounded-full" />
        </div>
      </article>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <article className="card space-y-3">
          <div className="skeleton h-2 w-14" />
          <div className="skeleton h-6 w-3/4" />
          <div className="skeleton h-4 w-full" />
          <div className="skeleton h-4 w-5/6" />
        </article>
        <article className="card space-y-3">
          <div className="skeleton h-2 w-14" />
          <div className="skeleton h-6 w-2/3" />
          <div className="skeleton h-4 w-full" />
          <div className="skeleton h-4 w-4/5" />
        </article>
        <article className="card space-y-3">
          <div className="skeleton h-2 w-14" />
          <div className="skeleton h-6 w-3/5" />
          <div className="skeleton h-4 w-full" />
          <div className="skeleton h-4 w-3/4" />
        </article>
        <article className="card space-y-3">
          <div className="skeleton h-2 w-14" />
          <div className="skeleton h-6 w-2/3" />
          <div className="skeleton h-4 w-full" />
          <div className="skeleton h-4 w-4/5" />
        </article>
      </section>
    </section>
  );
}
