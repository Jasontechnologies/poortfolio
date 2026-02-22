'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';

type Product = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  short_description: string | null;
  landing_url: string | null;
  logo_url: string | null;
  status: 'draft' | 'live';
  sort_order: number;
};

type ProductsResponse = {
  error?: string;
  products?: Product[];
};

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState('');
  const [newProduct, setNewProduct] = useState({
    name: '',
    slug: '',
    description: '',
    short_description: '',
    landing_url: '',
    logo_url: '',
    status: 'draft' as 'draft' | 'live',
    sort_order: 100
  });

  const liveCount = useMemo(
    () => products.filter((product) => product.status === 'live').length,
    [products]
  );

  const loadProducts = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/products', { cache: 'no-store' });
      const payload = (await response.json()) as ProductsResponse;
      if (!response.ok) {
        setStatus(payload.error ?? 'Unable to load products.');
        return;
      }
      setProducts(payload.products ?? []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadProducts();
  }, []);

  const createProduct = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setStatus('');

    const response = await fetch('/api/admin/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newProduct)
    });
    const payload = (await response.json()) as { error?: string };
    setSaving(false);

    if (!response.ok) {
      setStatus(payload.error ?? 'Unable to create product.');
      return;
    }

    setStatus('Product created.');
    setNewProduct({
      name: '',
      slug: '',
      description: '',
      short_description: '',
      landing_url: '',
      logo_url: '',
      status: 'draft',
      sort_order: 100
    });
    void loadProducts();
  };

  const updateProductFromForm = async (event: FormEvent<HTMLFormElement>, id: string) => {
    event.preventDefault();
    setSaving(true);
    setStatus('');
    const form = new FormData(event.currentTarget);

    const response = await fetch('/api/admin/products', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id,
        name: String(form.get('name') ?? '').trim(),
        slug: String(form.get('slug') ?? '').trim(),
        description: String(form.get('description') ?? '').trim(),
        short_description: String(form.get('short_description') ?? '').trim(),
        landing_url: String(form.get('landing_url') ?? '').trim(),
        logo_url: String(form.get('logo_url') ?? '').trim(),
        status: String(form.get('status') ?? 'draft'),
        sort_order: Number(form.get('sort_order') ?? 100)
      })
    });
    const payload = (await response.json()) as { error?: string };
    setSaving(false);

    if (!response.ok) {
      setStatus(payload.error ?? 'Unable to update product.');
      return;
    }

    setStatus('Product updated.');
    void loadProducts();
  };

  const setLiveState = async (id: string, statusValue: 'draft' | 'live') => {
    setSaving(true);
    setStatus('');
    const response = await fetch('/api/admin/products', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status: statusValue })
    });
    const payload = (await response.json()) as { error?: string };
    setSaving(false);

    if (!response.ok) {
      setStatus(payload.error ?? 'Unable to change status.');
      return;
    }

    setStatus(statusValue === 'live' ? 'Product set live.' : 'Product moved to draft.');
    void loadProducts();
  };

  const moveProduct = async (product: Product, direction: 'up' | 'down') => {
    const sorted = [...products].sort((a, b) => a.sort_order - b.sort_order);
    const index = sorted.findIndex((item) => item.id === product.id);
    if (index < 0) return;
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= sorted.length) return;

    const swapTarget = sorted[swapIndex];
    if (!swapTarget) return;

    setSaving(true);
    setStatus('');
    const [firstResponse, secondResponse] = await Promise.all([
      fetch('/api/admin/products', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: product.id, sort_order: swapTarget.sort_order })
      }),
      fetch('/api/admin/products', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: swapTarget.id, sort_order: product.sort_order })
      })
    ]);
    setSaving(false);

    if (!firstResponse.ok || !secondResponse.ok) {
      setStatus('Unable to reorder products.');
      return;
    }

    setStatus('Products reordered.');
    void loadProducts();
  };

  const deleteProduct = async (id: string) => {
    setSaving(true);
    setStatus('');
    const response = await fetch(`/api/admin/products?id=${encodeURIComponent(id)}`, {
      method: 'DELETE'
    });
    const payload = (await response.json()) as { error?: string };
    setSaving(false);

    if (!response.ok) {
      setStatus(payload.error ?? 'Unable to delete product.');
      return;
    }

    setStatus('Product deleted.');
    void loadProducts();
  };

  return (
    <section className="space-y-4 py-4">
      <article className="card">
        <h1 className="text-3xl font-bold">Products</h1>
        <p className="mt-2 text-black/70">
          Create and manage product entries, publishing state, and sort order.
        </p>
        <p className="mt-2 text-black/70">
          {products.length} total products, {liveCount} live.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <a href="#create-product" className="btn-primary">Create Product</a>
          <Link href="/admin" className="btn-subtle">Back to Admin</Link>
        </div>
      </article>

      <article id="create-product" className="card">
        <h2 className="text-xl font-semibold">Create or update product</h2>
        <p className="mt-2 text-black/70">
          Maintain product names, slugs, descriptions, landing URLs, and publication state.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <button type="submit" form="create-product-form" className="btn-subtle" disabled={saving}>
            Save Product
          </button>
          <span className="btn-subtle !cursor-default !opacity-70">Publish/Unpublish</span>
        </div>
        <form id="create-product-form" onSubmit={createProduct} className="mt-4 grid gap-3 md:grid-cols-2">
          <input
            name="name"
            value={newProduct.name}
            onChange={(event) => setNewProduct((prev) => ({ ...prev, name: event.target.value }))}
            className="rounded-lg border border-black/20 p-2"
            placeholder="Name"
            required
          />
          <input
            name="slug"
            value={newProduct.slug}
            onChange={(event) => setNewProduct((prev) => ({ ...prev, slug: event.target.value }))}
            className="rounded-lg border border-black/20 p-2"
            placeholder="slug"
            required
          />
          <input
            name="landing_url"
            value={newProduct.landing_url}
            onChange={(event) => setNewProduct((prev) => ({ ...prev, landing_url: event.target.value }))}
            className="rounded-lg border border-black/20 p-2 md:col-span-2"
            placeholder="Landing URL"
          />
          <input
            name="logo_url"
            value={newProduct.logo_url}
            onChange={(event) => setNewProduct((prev) => ({ ...prev, logo_url: event.target.value }))}
            className="rounded-lg border border-black/20 p-2 md:col-span-2"
            placeholder="Logo URL"
          />
          <textarea
            name="description"
            value={newProduct.description}
            onChange={(event) => setNewProduct((prev) => ({ ...prev, description: event.target.value }))}
            className="rounded-lg border border-black/20 p-2 md:col-span-2"
            placeholder="Description"
            required
          />
          <textarea
            name="short_description"
            value={newProduct.short_description}
            onChange={(event) => setNewProduct((prev) => ({ ...prev, short_description: event.target.value }))}
            className="rounded-lg border border-black/20 p-2 md:col-span-2"
            placeholder="Short description"
          />
          <select
            name="status"
            value={newProduct.status}
            onChange={(event) =>
              setNewProduct((prev) => ({ ...prev, status: event.target.value as 'draft' | 'live' }))
            }
            className="rounded-lg border border-black/20 p-2"
          >
            <option value="draft">Draft</option>
            <option value="live">Live</option>
          </select>
          <input
            name="sort_order"
            type="number"
            value={newProduct.sort_order}
            onChange={(event) =>
              setNewProduct((prev) => ({
                ...prev,
                sort_order: Number(event.target.value || 100)
              }))
            }
            className="rounded-lg border border-black/20 p-2"
            placeholder="Sort order"
          />
          <button type="submit" className="btn-primary md:col-span-2" disabled={saving}>
            {saving ? 'Saving...' : 'Create Product'}
          </button>
        </form>
      </article>

      <article className="card">
        <h2 className="text-2xl font-semibold">Public listing controls</h2>
        <p className="mt-3 text-black/70">
          Only live products appear on the public product hub.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link href="/products" className="btn-subtle">View Public Products</Link>
          <Link href="/admin/audit-log" className="btn-subtle">View Audit Log</Link>
        </div>
      </article>

      <div className="space-y-3">
        {loading ? <article className="card">Loading products...</article> : null}
        {!loading && products.length === 0 ? <article className="card">No products yet.</article> : null}
        {products.map((product) => (
          <article key={product.id} className="card">
            <form onSubmit={(event) => updateProductFromForm(event, product.id)} className="grid gap-3 md:grid-cols-2">
              <input name="name" defaultValue={product.name} className="rounded-lg border border-black/20 p-2" required />
              <input name="slug" defaultValue={product.slug} className="rounded-lg border border-black/20 p-2" required />
              <input
                name="landing_url"
                defaultValue={product.landing_url ?? ''}
                className="rounded-lg border border-black/20 p-2 md:col-span-2"
              />
              <input
                name="logo_url"
                defaultValue={product.logo_url ?? ''}
                className="rounded-lg border border-black/20 p-2 md:col-span-2"
              />
              <textarea
                name="description"
                defaultValue={product.description ?? product.short_description ?? ''}
                className="rounded-lg border border-black/20 p-2 md:col-span-2"
                required
              />
              <textarea
                name="short_description"
                defaultValue={product.short_description ?? ''}
                className="rounded-lg border border-black/20 p-2 md:col-span-2"
              />
              <select name="status" defaultValue={product.status} className="rounded-lg border border-black/20 p-2">
                <option value="draft">Draft</option>
                <option value="live">Live</option>
              </select>
              <input
                name="sort_order"
                type="number"
                defaultValue={product.sort_order}
                className="rounded-lg border border-black/20 p-2"
              />
              <div className="flex flex-wrap gap-2 md:col-span-2">
                <button type="submit" className="btn-subtle" disabled={saving}>
                  Save
                </button>
                <button
                  type="button"
                  className="btn-subtle"
                  disabled={saving}
                  onClick={() => setLiveState(product.id, product.status === 'live' ? 'draft' : 'live')}
                >
                  {product.status === 'live' ? 'Unpublish' : 'Publish'}
                </button>
                <button
                  type="button"
                  className="btn-subtle"
                  disabled={saving}
                  onClick={() => moveProduct(product, 'up')}
                >
                  Move up
                </button>
                <button
                  type="button"
                  className="btn-subtle"
                  disabled={saving}
                  onClick={() => moveProduct(product, 'down')}
                >
                  Move down
                </button>
                <button type="button" className="btn-subtle" disabled={saving} onClick={() => deleteProduct(product.id)}>
                  Delete
                </button>
              </div>
            </form>
          </article>
        ))}
      </div>

      {status ? <p className="text-sm text-black/70">{status}</p> : null}
    </section>
  );
}
