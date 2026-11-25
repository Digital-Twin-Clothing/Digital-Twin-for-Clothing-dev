import Link from "next/link";
import { getProducts } from "@/lib/shop";
import { ShopGrid } from "./ShopGrid";

export const metadata = { title: "Shop" };

export default async function ShopPage() {
  const products = await getProducts();

  return (
    <div className="min-h-screen bg-bg">
      <div className="mx-auto max-w-6xl px-6 py-20">
        <Link
          href="/"
          className="inline-flex items-center text-sm text-mute hover:text-ink transition-colors mb-8"
        >
          ← Back to home
        </Link>
        <h1 className="text-4xl font-serif text-ink mb-3">Shop</h1>
        <p className="text-mute mb-10">Clothing from multiple online stores, in one place.</p>
        <ShopGrid products={products} />
      </div>
    </div>
  );
}
