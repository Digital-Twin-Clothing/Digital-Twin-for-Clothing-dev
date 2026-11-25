import { unstable_cache } from "next/cache";

export type ClothingType =
  | "T-Shirts"
  | "Shirts"
  | "Tops"
  | "Sweaters & Hoodies"
  | "Outerwear"
  | "Pants"
  | "Jeans"
  | "Shorts"
  | "Leggings"
  | "Dresses"
  | "Sets & Jumpsuits";

export type Product = {
  id: string;
  title: string;
  price: number;
  image: string;
  images: string[];
  description: string;
  materials: string | null;
  brand: string;
  type: ClothingType;
  sizes: string[];
  /** Link to the product on the original store. */
  url: string;
};

type ShopifyProduct = {
  id: number;
  title: string;
  handle: string;
  body_html: string | null;
  vendor: string;
  product_type: string;
  tags: string[] | string;
  options: { name: string; values: string[] }[];
  variants: { price: string; available: boolean; option1: string | null; option2: string | null; option3: string | null }[];
  images: { src: string }[];
};

const STORES = [
  { key: "gs", domain: "gymshark.com", pages: 2 },
  { key: "fn", domain: "fashionnova.com", pages: 2 },
  { key: "ts", domain: "taylorstitch.com", pages: 1 },
];

const MAX_PER_STORE = 130;

// Order matters: first match wins. Items that match EXCLUDE are not clothing we want.
const EXCLUDE =
  /lingerie|bra\b|bralette|underwear|thong|brief|sock|hat\b|cap\b|beanie|bag|backpack|belt|wallet|scarf|glove|sneaker|shoe|boot|sandal|slipper|heel|gift|card|bottle|towel|mask|jewel|necklace|earring|ring\b|sunglass|keychain|sticker|candle|swim|bikini|bodysuit|shapewear|placeholder|accessor/i;

const RULES: [RegExp, ClothingType][] = [
  [/dress|gown|skirt/i, "Dresses"],
  [/jumpsuit|romper|matching set|\bset\b|co-?ord|tracksuit/i, "Sets & Jumpsuits"],
  [/legging|tights|yoga pant/i, "Leggings"],
  [/jean|denim/i, "Jeans"],
  [/short/i, "Shorts"],
  [/jacket|coat|outerwear|parka|vest|puffer|bomber|windbreaker|anorak|overshirt|blazer/i, "Outerwear"],
  [/hoodie|sweatshirt|sweater|knit|cardigan|pullover|fleece|crewneck|jumper/i, "Sweaters & Hoodies"],
  [/pant|trouser|jogger|chino|bottom|sweatpant/i, "Pants"],
  [/t-?shirt|\btee\b|tees/i, "T-Shirts"],
  [/shirt|woven|button|polo|henley/i, "Shirts"],
  [/top|tank|crop|bandeau|blouse|cami|corset|ss |ls |sleeveless/i, "Tops"],
];

function classify(p: ShopifyProduct): ClothingType | null {
  const text = `${p.product_type} ${p.title}`;
  if (EXCLUDE.test(text)) return null;
  for (const [re, type] of RULES) if (re.test(text)) return type;
  return null;
}

const FIBER = /\b(cotton|polyester|nylon|elastane|spandex|wool|linen|viscose|rayon|cashmere|lyocra|modal|acrylic|lyocell|silk|leather)\b/i;

function stripHtml(html: string): string {
  return html
    .replace(/<(br|\/p|\/li|\/div)\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#39;|&rsquo;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/[ \t]+/g, " ")
    .replace(/\n\s*\n+/g, "\n")
    .trim();
}

function extractMaterials(text: string): string | null {
  const line = text
    .split(/\n|(?<=\.)\s/)
    .map((l) => l.trim())
    .find((l) => l.length < 200 && FIBER.test(l) && /%|fabric|made|blend|material|cotton|polyester/i.test(l));
  return line ?? null;
}

function sized(url: string): string {
  return url + (url.includes("?") ? "&" : "?") + "width=900";
}

function normalize(p: ShopifyProduct, store: { key: string; domain: string }): Product | null {
  const type = classify(p);
  if (!type || p.images.length === 0) return null;

  const idx = p.options.findIndex((o) => /size/i.test(o.name));
  const available = p.variants.filter((v) => v.available);
  if (available.length === 0) return null;

  const sizeOf = (v: ShopifyProduct["variants"][number]) => (idx === 0 ? v.option1 : idx === 1 ? v.option2 : idx === 2 ? v.option3 : null);
  const order = idx >= 0 ? p.options[idx].values : [];
  const sizes = Array.from(new Set(available.map(sizeOf).filter((s): s is string => !!s && s !== "Default Title"))).sort(
    (a, b) => order.indexOf(a) - order.indexOf(b),
  );
  if (sizes.length === 0) sizes.push("One size");

  const price = Math.min(...available.map((v) => parseFloat(v.price)));
  if (!isFinite(price) || price <= 0) return null;

  const text = stripHtml(p.body_html ?? "");
  const description = text.length > 420 ? text.slice(0, 417).trimEnd() + "…" : text;

  return {
    id: `${store.key}-${p.id}`,
    title: p.title,
    price,
    image: sized(p.images[0].src),
    images: p.images.slice(0, 6).map((i) => sized(i.src)),
    description: description || `${p.title} from ${p.vendor}.`,
    materials: extractMaterials(text),
    brand: p.vendor,
    type,
    sizes,
    url: `https://${store.domain}/products/${p.handle}`,
  };
}

async function fetchStore(store: (typeof STORES)[number]): Promise<Product[]> {
  const out: Product[] = [];
  for (let page = 1; page <= store.pages; page++) {
    try {
      const res = await fetch(`https://${store.domain}/products.json?limit=100&page=${page}`, {
        headers: { "User-Agent": "Mozilla/5.0 (compatible; digital-twins-shop/0.1)" },
        cache: "no-store",
        signal: AbortSignal.timeout(15000),
      });
      if (!res.ok) break;
      const data = (await res.json()) as { products: ShopifyProduct[] };
      for (const p of data.products) {
        const n = normalize(p, store);
        if (n) out.push(n);
      }
    } catch {
      break;
    }
  }
  return out.slice(0, MAX_PER_STORE);
}

/** Pulls clothing from every store; a failing store is skipped, not fatal. */
async function loadProducts(): Promise<Product[]> {
  const settled = await Promise.allSettled(STORES.map(fetchStore));
  const lists = settled.map((r) => (r.status === "fulfilled" ? r.value : []));
  // Interleave so the default view mixes stores instead of showing one brand first.
  const mixed: Product[] = [];
  for (let i = 0; lists.some((l) => i < l.length); i++) for (const l of lists) if (i < l.length) mixed.push(l[i]);
  return mixed;
}

export const getProducts = unstable_cache(loadProducts, ["shop-products-v1"], { revalidate: 3600 });

export async function getProduct(id: string): Promise<Product | undefined> {
  return (await getProducts()).find((p) => p.id === id);
}

/** Same-type items first, topped up with others, never the product itself. */
export async function getSuggested(product: Product, count = 8): Promise<Product[]> {
  const all = (await getProducts()).filter((p) => p.id !== product.id);
  const same = all.filter((p) => p.type === product.type);
  const rest = all.filter((p) => p.type !== product.type);
  return [...same, ...rest].slice(0, count);
}
