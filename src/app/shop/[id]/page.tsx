import Link from "next/link";
import { notFound } from "next/navigation";
import { getProduct, getSuggested } from "@/lib/shop";
import { ProductDetail } from "./ProductDetail";

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = await getProduct(id);
  if (!product) notFound();
  const suggested = await getSuggested(product);

  return (
    <div className="min-h-screen bg-bg">
      <div className="mx-auto max-w-6xl px-6 py-16">
        <Link
          href="/shop"
          className="mb-8 inline-flex items-center text-sm text-mute transition-colors hover:text-ink"
        >
          ← Back to shop
        </Link>
        <ProductDetail key={product.id} product={product} />

        <section className="mt-24">
          <h2 className="mb-8 font-serif text-3xl text-ink">You may also like</h2>
          <ul className="grid grid-cols-2 gap-x-5 gap-y-10 md:grid-cols-4">
            {suggested.map((p) => (
              <li key={p.id}>
                <Link href={`/shop/${p.id}`} className="group block">
                  <div className="aspect-[3/4] overflow-hidden rounded-xl bg-white">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={p.image}
                      alt={p.title}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                  <p className="mt-3 text-xs uppercase tracking-wide text-mute">{p.brand}</p>
                  <h3 className="mt-0.5 line-clamp-2 text-sm text-ink">{p.title}</h3>
                  <p className="mt-1 text-sm font-medium text-ink">${p.price.toFixed(2)}</p>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
