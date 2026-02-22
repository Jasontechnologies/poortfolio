import type { Metadata } from 'next';
import { HomeContent, type HomeProduct } from '@/components/home-content';
import { buildPortfolioProducts, liveFallbackProducts } from '@/lib/data/products';
import { createClient } from '@/lib/supabase/server';
import { getFeatureFlags } from '@/lib/supabase/feature-flags';

export const metadata: Metadata = {
  title: 'JasonWorldOfTech | Founder-Led AI Products',
  description:
    'JasonWorldOfTech is a founder-led AI software studio building practical, privacy-first products for creators and businesses.'
};

export default async function HomePage() {
  const supabase = await createClient();
  const flags = await getFeatureFlags(supabase);

  if (!flags.products_enabled) {
    return <HomeContent products={buildPortfolioProducts(liveFallbackProducts)} />;
  }

  const { data, error } = await supabase
    .from('products')
    .select('name,slug,short_description,landing_url')
    .eq('status', 'live')
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false });

  const liveProducts: HomeProduct[] =
    !error && data && data.length > 0
      ? data.map((product) => ({
          name: product.name,
          slug: product.slug,
          summary: product.short_description,
          status: 'live',
          landingUrl: product.landing_url
        }))
      : liveFallbackProducts;

  return <HomeContent products={buildPortfolioProducts(liveProducts)} />;
}
