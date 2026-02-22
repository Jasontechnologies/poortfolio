export default function ChatLoading() {
  return (
    <section className="max-w-2xl space-y-4 py-4">
      <div className="loading-top-bar rounded-full" />
      <article className="card space-y-4">
        <div className="skeleton h-9 w-56" />
        <div className="skeleton h-5 w-full max-w-xl" />
        <div className="skeleton h-32 w-full" />
        <div className="skeleton h-10 w-40 rounded-full" />
      </article>
    </section>
  );
}
