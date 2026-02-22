import Link from 'next/link';

type Product = {
  name: string;
  slug: string;
  summary: string;
};

export function ProductCard({ product }: { product: Product }) {
  return (
    <article className="card">
      <p className="mb-3 h-1.5 w-12 rounded-full" style={{ background: '#b8e35a' }} />
      <h3 className="text-lg font-semibold tracking-tight text-black">{product.name}</h3>
      <p className="mt-2 text-sm text-black/65">{product.summary}</p>
      <Link href={`/products#${product.slug}`} className="mt-5 inline-block text-sm font-medium text-black underline underline-offset-4">
        Learn more
      </Link>
    </article>
  );
}
