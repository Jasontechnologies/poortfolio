export default function BlogPostLoading() {
  return (
    <article className="card max-w-4xl space-y-4 py-4">
      <div className="loading-top-bar rounded-full" />
      <div className="skeleton h-10 w-4/5" />
      <div className="skeleton h-4 w-44" />
      <div className="skeleton h-5 w-full" />
      <div className="skeleton h-5 w-5/6" />
      <div className="space-y-2 rounded-xl border border-black/10 bg-white/60 p-4">
        <div className="skeleton h-4 w-full" />
        <div className="skeleton h-4 w-full" />
        <div className="skeleton h-4 w-4/5" />
        <div className="skeleton h-4 w-5/6" />
      </div>
    </article>
  );
}
