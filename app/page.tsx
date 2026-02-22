import { ProductCard } from '@/components/product-card';
import { products } from '@/lib/data/products';

export default function HomePage() {
  return (
    <section className="space-y-8">
      <div className="card border-l-8 border-l-[#b8e35a]">
        <p className="text-xs font-semibold uppercase tracking-wider text-black/60">Personal Brand + Parent Company + Product Hub</p>
        <h1 className="mt-2 text-4xl font-bold">Build, launch, and support products from one platform.</h1>
        <p className="mt-3 max-w-3xl text-black/75">
          JasonWorldOfTech is your central digital presence: showcase your story, publish your products, and let users sign in with Google to chat with you or submit product complaints.
        </p>
        <div className="mt-5 flex gap-3">
          <a href="/sign-in" className="btn-accent">Sign in with Google</a>
          <a href="/support/complaints/new" className="btn-primary">Report a Complaint</a>
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-semibold">Featured Products</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {products.map((product) => (
            <ProductCard key={product.slug} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
}
