'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import type { PortfolioProduct } from '@/lib/data/products';

function isExternalLink(href: string) {
  return /^https?:\/\//i.test(href);
}

export function ProductCard({ product, index = 0 }: { product: PortfolioProduct; index?: number }) {
  const isLive = product.status === 'live';
  const ctaHref = product.ctaHref ?? (isLive ? product.landingUrl ?? `/products#${product.slug}` : '/updates');
  const ctaLabel = product.ctaLabel ?? (isLive ? 'Visit Product' : 'Notify me');

  return (
    <motion.article
      data-product-card
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1], delay: Math.min(index * 0.05, 0.28) }}
      whileHover={{ y: -4 }}
      className="group relative overflow-hidden rounded-3xl border border-[#d5deed] bg-white/84 p-6 shadow-[0_10px_30px_rgba(15,21,39,0.08)] transition-shadow duration-300 hover:shadow-[0_18px_38px_rgba(22,33,63,0.16)]"
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-[#dff0a8] to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      <div className="relative space-y-3">
        <div className="flex items-center justify-between gap-3">
          <p className="h-1.5 w-12 rounded-full bg-[#b8e35a]" />
          <span
            className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.1em] ${
              isLive ? 'border-[#b8e35a] bg-[#dff4be] text-[#1d3908]' : 'border-[#ced8ec] bg-[#f2f5fc] text-[#3b486a]'
            }`}
          >
            {isLive ? 'Live' : 'Coming Soon'}
          </span>
        </div>
        <h3 className="text-lg font-semibold tracking-tight text-[#10172f]">{product.name}</h3>
        <p className="text-sm text-[#4d5874]">{product.summary}</p>
        {isExternalLink(ctaHref) ? (
          <a
            href={ctaHref}
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#1d2a4f] transition-colors hover:text-[#111a31]"
          >
            {ctaLabel}
            <span aria-hidden className="transition-transform duration-200 group-hover:translate-x-0.5">
              &rarr;
            </span>
          </a>
        ) : (
          <Link
            href={ctaHref}
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#1d2a4f] transition-colors hover:text-[#111a31]"
          >
            {ctaLabel}
            <span aria-hidden className="transition-transform duration-200 group-hover:translate-x-0.5">
              &rarr;
            </span>
          </Link>
        )}
      </div>
    </motion.article>
  );
}
