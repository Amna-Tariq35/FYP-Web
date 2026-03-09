import { getProducts } from "@/src/lib/catalog/queries";
import ProductsClient from "@/src/components/products/ProductsClient";

export default async function ProductsPage() {
  const products = await getProducts();

  return (
    <main className="min-h-screen bg-[var(--bg-base)]">
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[var(--text-main)] tracking-tight">
            Makeup Collection
          </h1>
          <p className="mt-2 text-[var(--text-muted)] max-w-2xl">
            Browse our exclusive collection of products, explore shades, and find your perfect match.
          </p>
        </div>

        {/* Client Component */}
        <ProductsClient initialProducts={products} />
      </div>
    </main>
  );
}