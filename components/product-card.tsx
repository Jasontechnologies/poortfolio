import Link from 'next/link';

type Product = {
  name: string;
  slug: string;
  summary: string;
};

export function ProductCard({ product }: { product: Product }) {
  return (
    <article className="card">
      <h3 className="text-xl font-semibold">{product.name}</h3>
      <p className="mt-2 text-black/70">{product.summary}</p>
      <Link href={`/products#${product.slug}`} className="mt-4 inline-block text-sm font-medium text-black underline">
        View product
      </Link>
    </article>
  );
}
