'use client';

import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ProductCard } from '@/components/product-card';
import type { PortfolioProduct, PortfolioStatus } from '@/lib/data/products';

type FilterKey = 'all' | PortfolioStatus;

const filterConfig: { key: FilterKey; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'live', label: 'Live' },
  { key: 'coming_soon', label: 'Coming Soon' }
];

export function PortfolioGrid({ products }: { products: PortfolioProduct[] }) {
  const [filter, setFilter] = useState<FilterKey>('all');

  const filteredProducts = useMemo(
    () => (filter === 'all' ? products : products.filter((product) => product.status === filter)),
    [filter, products]
  );

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {filterConfig.map((chip) => (
          <button
            key={chip.key}
            type="button"
            onClick={() => setFilter(chip.key)}
            className={`rounded-full border px-3 py-1 text-sm font-semibold transition-colors ${
              filter === chip.key
                ? 'border-[#97c74a] bg-[#d9f395] text-[#192109]'
                : 'border-[#cfdaed] bg-white/80 text-[#304062] hover:border-[#b7c9ea] hover:text-[#1c2948]'
            }`}
          >
            {chip.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={filter}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
        >
          {filteredProducts.map((product, index) => (
            <ProductCard key={product.slug} product={product} index={index} />
          ))}
        </motion.div>
      </AnimatePresence>

      {filteredProducts.length === 0 ? (
        <article className="card text-sm text-[#3f4f74]">No products found for this filter yet.</article>
      ) : null}
    </section>
  );
}
