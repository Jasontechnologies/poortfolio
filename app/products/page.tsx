import { products } from '@/lib/data/products';

export default function ProductsPage() {
  return (
    <section>
      <h1 className="text-3xl font-bold">Product Launcher Hub</h1>
      <p className="mt-2 text-black/70">Discover, compare, and access your products from a single hub.</p>
      <div className="mt-6 space-y-3">
        {products.map((product) => (
          <article id={product.slug} key={product.slug} className="card">
            <h2 className="text-xl font-semibold">{product.name}</h2>
            <p className="text-black/70">{product.summary}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
