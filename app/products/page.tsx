import type { Metadata } from 'next';
import Link from 'next/link';
import { PortfolioGrid } from '@/components/products/portfolio-grid';
import { buildPortfolioProducts, liveFallbackProducts } from '@/lib/data/products';
import { createClient } from '@/lib/supabase/server';
import { getFeatureFlags } from '@/lib/supabase/feature-flags';

type ProductRow = {
  name: string;
  slug: string;
  short_description: string;
  landing_url: string | null;
};

export const metadata: Metadata = {
  title: 'Products | JasonWorldOfTech',
  description: 'Explore JasonWorldOfTech products, including Koola AI, with direct support and transparent security and privacy practices.'
};

export default async function ProductsPage() {
  const supabase = await createClient();
  const flags = await getFeatureFlags(supabase);

  if (!flags.products_enabled) {
    return (
      <section className="space-y-4 py-6">
        <article className="card max-w-2xl">
          <h1 className="text-3xl font-bold">Products</h1>
          <p className="mt-3 text-black/70">Products are temporarily unavailable while maintenance is in progress.</p>
          <Link href="/status" className="mt-4 inline-block text-sm font-semibold underline underline-offset-4">
            Check Status
          </Link>
        </article>
      </section>
    );
  }

  const { data, error } = await supabase
    .from('products')
    .select('name,slug,short_description,landing_url')
    .eq('status', 'live')
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false });

  const liveProducts =
    !error && data && data.length > 0
      ? (data as ProductRow[]).map((product) => ({
          name: product.name,
          slug: product.slug,
          summary: product.short_description,
          status: 'live' as const,
          landingUrl: product.landing_url
        }))
      : liveFallbackProducts;

  const portfolioProducts = buildPortfolioProducts(liveProducts);
  const koolaProduct = portfolioProducts.find((product) => product.slug === 'koola-ai') ?? portfolioProducts[0];
  const liveCount = portfolioProducts.filter((product) => product.status === 'live').length;
  const upcomingCount = portfolioProducts.filter((product) => product.status === 'coming_soon').length;

  return (
    <section className="space-y-8 py-4">
      <article className="card">
        <h1 className="text-3xl font-bold">Product Portfolio</h1>
        <p className="mt-3 text-black/75">
          JasonWorldOfTech is a multi-product AI studio. Koola AI is live today, and this grid expands as we ship new
          products under the same parent platform.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <a href={koolaProduct?.landingUrl ?? '/products#koola-ai'} className="btn-primary">
            Open Koola AI
          </a>
          <Link href="/updates" className="btn-subtle">
            Product Updates
          </Link>
        </div>
      </article>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <article className="card">
          <p className="metric-label">Total Portfolio</p>
          <p className="mt-2 text-2xl font-semibold text-[#1a2446]">{portfolioProducts.length}</p>
        </article>
        <article className="card">
          <p className="metric-label">Live Products</p>
          <p className="mt-2 text-2xl font-semibold text-[#1a2446]">{liveCount}</p>
        </article>
        <article className="card">
          <p className="metric-label">Coming Soon</p>
          <p className="mt-2 text-2xl font-semibold text-[#1a2446]">{upcomingCount}</p>
        </article>
        <article className="card">
          <p className="metric-label">Support</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link href="/support/chat" className="btn-subtle !px-3 !py-1.5">
              Start Chat
            </Link>
            <Link href="/contact" className="btn-subtle !px-3 !py-1.5">
              Contact
            </Link>
          </div>
        </article>
      </section>

      <PortfolioGrid products={portfolioProducts} />
    </section>
  );
}
