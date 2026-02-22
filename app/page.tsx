import Link from 'next/link';
import { ProductCard } from '@/components/product-card';
import { products } from '@/lib/data/products';

export default function HomePage() {
  return (
    <section className="space-y-16 py-8">
      <div className="mx-auto max-w-4xl text-center">
        <p className="inline-block rounded-full border px-3 py-1 text-xs font-medium" style={{ borderColor: '#d8d8d8' }}>
          Personal brand • Parent company • Product hub
        </p>
        <h1 className="mt-6 text-5xl font-semibold leading-tight tracking-tight text-black">
          One simple platform to build, launch, and support your products.
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-base text-black/65">
          A clean home for your brand, your ecosystem, and your customers — with Google sign-in, direct chat, and product complaints powered by Supabase.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Link href="/sign-in" className="btn-primary">
            Sign in with Google
          </Link>
          <Link href="/support/complaints/new" className="btn-subtle">
            Submit Complaint
          </Link>
        </div>
        <div className="mx-auto mt-10 h-1 w-40 rounded-full" style={{ background: '#b8e35a' }} />
      </div>

      <div>
        <h2 className="section-title">Featured products</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          {products.map((product) => (
            <ProductCard key={product.slug} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
}
