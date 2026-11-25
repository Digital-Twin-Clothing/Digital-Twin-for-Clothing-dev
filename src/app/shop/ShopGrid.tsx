"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { ClothingType, Product } from "@/lib/shop";

export function ShopGrid({ products }: { products: Product[] }) {
  const [active, setActive] = useState<ClothingType | "All">("All");

  const types = useMemo(
    () => Array.from(new Set(products.map((p) => p.type))).sort(),
    [products],
  );
  const visible = active === "All" ? products : products.filter((p) => p.type === active);

  if (products.length === 0) {
    return <p className="text-mute">Couldn&apos;t load products right now. Please try again later.</p>;
  }

  return (
    <>
      <div className="mb-10 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by clothing type">
          {(["All", ...types] as const).map((t) => (
            <button
              key={t}
              onClick={() => setActive(t)}
              aria-pressed={active === t}
              className={
                "rounded-full border px-4 py-1.5 text-sm transition-colors " +
                (active === t ? "border-ink bg-ink text-bg" : "border-line text-mute hover:text-ink")
              }
            >
              {t}
            </button>
          ))}
        </div>
        <p className="text-sm text-mute">{visible.length} items</p>
      </div>

      <ul className="grid grid-cols-2 gap-x-5 gap-y-10 md:grid-cols-3 lg:grid-cols-4">
        {visible.map((p) => (
          <li key={p.id}>
            <Link href={`/shop/${p.id}`} className="group block cursor-pointer">
              <div className="aspect-[3/4] overflow-hidden rounded-xl bg-white">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={p.image}
                  alt={p.title}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>
              <div className="mt-3 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs uppercase tracking-wide text-mute">{p.brand}</p>
                  <h2 className="mt-0.5 line-clamp-2 text-sm text-ink">{p.title}</h2>
                </div>
                <p className="shrink-0 text-sm font-medium text-ink">${p.price.toFixed(2)}</p>
              </div>
              <p className="mt-1 line-clamp-1 text-xs text-mute">{p.sizes.join(" · ")}</p>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
