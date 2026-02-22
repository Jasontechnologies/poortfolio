import { products } from '@/lib/data/products';

export default function ProductsPage() {
  return (
    <section className="space-y-6 py-6">
      <h1 className="section-title">Product launcher hub</h1>
      <p className="max-w-2xl text-black/65">Discover and access all products in your ecosystem from one place.</p>

      <div className="space-y-3">
        {products.map((product) => (
          <article id={product.slug} key={product.slug} className="card">
            <div className="mb-3 h-1 w-16 rounded-full" style={{ background: '#b8e35a' }} />
            <h2 className="text-xl font-semibold">{product.name}</h2>
            <p className="text-black/65">{product.summary}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
