export type PortfolioStatus = 'live' | 'coming_soon';

export type PortfolioProduct = {
  name: string;
  slug: string;
  summary: string;
  status: PortfolioStatus;
  landingUrl?: string | null;
  ctaLabel?: string;
  ctaHref?: string;
};

export const liveFallbackProducts: PortfolioProduct[] = [
  {
    name: 'Koola AI',
    slug: 'koola-ai',
    summary: 'AI-powered digital twin and avatar generation platform.',
    status: 'live',
    landingUrl: '/products#koola-ai'
  }
];

export const comingSoonProducts: PortfolioProduct[] = [
  {
    name: 'Studio Copilot',
    slug: 'studio-copilot',
    summary: 'An operations co-pilot for product launch workflows, customer signals, and roadmap decisions.',
    status: 'coming_soon',
    ctaLabel: 'Updates',
    ctaHref: '/updates'
  },
  {
    name: 'Orbit Signals',
    slug: 'orbit-signals',
    summary: 'Signal intelligence for growth teams to monitor opportunities, risks, and campaign health in one feed.',
    status: 'coming_soon',
    ctaLabel: 'Notify me',
    ctaHref: '/sign-in'
  },
  {
    name: 'Vault Ops',
    slug: 'vault-ops',
    summary: 'Secure automation pipelines for teams shipping AI workflows with audit-ready controls.',
    status: 'coming_soon',
    ctaLabel: 'Updates',
    ctaHref: '/updates'
  }
];

export function buildPortfolioProducts(liveProducts: PortfolioProduct[]) {
  const normalizedLive = liveProducts.map((product) => ({ ...product, status: 'live' as const }));
  const liveSlugs = new Set(normalizedLive.map((product) => product.slug));
  const upcoming = comingSoonProducts.filter((product) => !liveSlugs.has(product.slug));
  return [...normalizedLive, ...upcoming];
}

export const products = liveFallbackProducts;
