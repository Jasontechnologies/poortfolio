'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ProductCard } from '@/components/product-card';
import type { PortfolioProduct } from '@/lib/data/products';

export type HomeProduct = PortfolioProduct;

export function HomeContent({ products }: { products: HomeProduct[] }) {
  const studioCapabilities = [
    {
      title: 'AI Product Development',
      summary: 'Founder-led product execution from concept to launch with measurable delivery milestones.'
    },
    {
      title: 'Secure Infrastructure',
      summary: 'Production-ready systems with operational guardrails, observability, and abuse prevention.'
    },
    {
      title: 'Privacy-First Systems',
      summary: 'Data handling designed around consent, accountability, and user trust from day one.'
    },
    {
      title: 'Creator-Focused Tools',
      summary: 'Practical workflows for creators and teams that need outcomes, not generic AI demos.'
    }
  ];

  return (
    <section className="space-y-8 py-4">
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
        className="hero-shell grid gap-6 lg:grid-cols-[1.4fr,1fr]"
      >
        <div className="relative space-y-5">
          <span className="hero-chip inline-flex">AI SOFTWARE STUDIO</span>
          <h1 className="text-3xl font-bold leading-tight md:text-5xl">
            Building intelligent AI products for creators and businesses.
          </h1>
          <p className="max-w-3xl text-black/75">
            JasonWorldOfTech is an independent AI software studio founded by Clinton Adeoye. We design scalable,
            privacy-first applications that combine modern infrastructure with practical real-world use cases.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/sign-in" className="btn-primary">
              Create Account
            </Link>
            <Link href="/support/chat" className="btn-subtle">
              Start a Conversation
            </Link>
          </div>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {studioCapabilities.map((capability) => (
              <span key={capability.title} className="hero-chip text-center">
                {capability.title}
              </span>
            ))}
          </div>
        </div>

        <aside className="hero-panel">
          <div className="hero-panel-glow" />
          <h2 className="text-2xl font-semibold text-[#182347]">Company Overview</h2>
          <div className="mt-4 space-y-2">
            <div className="metric-row">
              <span className="metric-label">Active Products</span>
              <span className="metric-value">01</span>
            </div>
            <div className="metric-row">
              <span className="metric-label">Model</span>
              <span className="metric-value">Founder-Led Studio</span>
            </div>
            <div className="metric-row">
              <span className="metric-label">Focus</span>
              <span className="metric-value">AI Applications</span>
            </div>
            <div className="metric-row">
              <span className="metric-label">Status</span>
              <span className="metric-value inline-flex items-center gap-2">
                <span className="signal-dot" />
                Building
              </span>
            </div>
          </div>
          <p className="mt-4 text-sm text-[#4f5d82]">Independent. Focused. Scaling.</p>
        </aside>
      </motion.section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {studioCapabilities.map((capability, index) => (
          <motion.article
            key={capability.title}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1], delay: Math.min(index * 0.05, 0.2) }}
            className="card"
          >
            <h3 className="text-lg font-semibold text-[#192347]">{capability.title}</h3>
            <p className="mt-2 text-sm text-[#4d5874]">{capability.summary}</p>
          </motion.article>
        ))}
      </section>

      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-2xl font-semibold">Product Portfolio</h2>
          <Link href="/products" className="btn-subtle">
            View All Products
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {products.map((product, index) => (
            <ProductCard key={product.slug} product={product} index={index} />
          ))}
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <motion.article
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1], delay: 0.08 }}
          className="card"
        >
          <h2 className="text-2xl font-semibold">Security and privacy operations</h2>
          <p className="mt-3 text-black/75">
            User content and support conversations are private by default. You control your account data, and privacy
            requests can be submitted at any time.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link href="/security" className="btn-subtle">
              Read Security
            </Link>
            <Link href="/privacy" className="btn-subtle">
              Read Privacy Policy
            </Link>
          </div>
        </motion.article>
        <motion.article
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1], delay: 0.14 }}
          className="card"
        >
          <h2 className="text-2xl font-semibold">Updates and platform status</h2>
          <p className="mt-3 text-black/75">
            Follow product updates, incidents, and operational notices from the studio without leaving this parent
            platform.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link href="/updates" className="btn-subtle">
              View Updates
            </Link>
            <Link href="/status" className="btn-subtle">
              Check Status
            </Link>
          </div>
        </motion.article>
      </section>
    </section>
  );
}
