"use client";

import { useState } from "react";
import type { Product } from "@/lib/shop";

export function ProductDetail({ product }: { product: Product }) {
  const [imgIndex, setImgIndex] = useState(0);
  const [size, setSize] = useState<string | null>(null);

  const rows = [
    ["Category", product.type],
    ["Materials", product.materials ?? "See the store listing for fabric details"],
    ["Sizes in stock", product.sizes.join(", ")],
    ["Sold by", product.brand],
  ];

  return (
    <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
      <div className="flex flex-col-reverse gap-4 sm:flex-row">
        {product.images.length > 1 && (
          <div className="flex gap-3 sm:flex-col">
            {product.images.slice(0, 5).map((src, i) => (
              <button
                key={src}
                onClick={() => setImgIndex(i)}
                aria-label={`View image ${i + 1}`}
                className={
                  "h-20 w-16 overflow-hidden rounded-lg border bg-white " +
                  (i === imgIndex ? "border-ink" : "border-line")
                }
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt="" className="h-full w-full object-contain" />
              </button>
            ))}
          </div>
        )}
        <div className="aspect-[4/5] flex-1 overflow-hidden rounded-2xl bg-white">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={product.images[imgIndex]}
            alt={product.title}
            className="h-full w-full object-cover"
          />
        </div>
      </div>

      <div>
        <p className="text-xs uppercase tracking-wide text-mute">{product.brand}</p>
        <h1 className="mt-2 font-serif text-4xl text-ink">{product.title}</h1>
        <p className="mt-4 text-2xl text-ink">${product.price.toFixed(2)}</p>
        <p className="mt-6 whitespace-pre-line leading-relaxed text-mute">{product.description}</p>

        <div className="mt-8">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-medium text-ink">Size</h2>
            <span className="text-sm text-mute">{size ? `Selected: ${size}` : "Select a size"}</span>
          </div>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Size">
            {product.sizes.map((s) => (
              <button
                key={s}
                onClick={() => setSize(s)}
                aria-pressed={size === s}
                className={
                  "min-w-14 rounded-lg border px-4 py-2.5 text-sm transition-colors " +
                  (size === s ? "border-ink bg-ink text-bg" : "border-line text-ink hover:border-ink")
                }
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <button
          disabled={!size}
          className="mt-8 w-full rounded-full bg-ink px-6 py-3.5 text-sm text-bg transition-opacity disabled:opacity-40"
        >
          {size ? "Add to bag" : "Select a size"}
        </button>

        <a
          href={product.url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 block text-center text-sm text-mute underline-offset-4 hover:text-ink hover:underline"
        >
          View on {new URL(product.url).hostname.replace("www.", "")} ↗
        </a>

        <dl className="mt-10 divide-y divide-line border-t border-line">
          {rows.map(([k, v]) => (
            <div key={k} className="grid grid-cols-3 gap-4 py-4 text-sm">
              <dt className="text-mute">{k}</dt>
              <dd className="col-span-2 text-ink">{v}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}
