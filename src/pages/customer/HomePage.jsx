import { useState, useMemo } from 'react'
import { Sparkles, X } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { useProducts, useStores, useCategories } from '@/hooks/useCatalogue'
import { CatalogueSearch } from '@/components/products/CatalogueSearch'
import { CategoryPills } from '@/components/products/CategoryPills'
import { ProductGrid } from '@/components/products/ProductGrid'
import { QuickCartBar } from '@/components/cart/QuickCartBar'
import { Badge } from '@/components/ui/Badge'
import { SAMPLE_CATEGORIES } from '@/mocks/categories'
import { SAMPLE_STORES } from '@/mocks/campus'

export default function HomePage() {
  const user = useAuthStore((s) => s.user)
  const firstName = user?.name?.split(' ')[0] ?? 'there'

  const [selectedCategory, setSelectedCategory] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')

  // Product-first: fetch all campus catalogue products without requiring store selection
  const {
    data: rawProducts = [],
    isLoading: isLoadingProducts,
    isError: isProductsError,
    error: productsError,
    refetch: refetchProducts,
  } = useProducts()

  const { data: stores = SAMPLE_STORES } = useStores()
  const { data: categories = SAMPLE_CATEGORIES } = useCategories()

  // Filter products by category and search
  const filteredProducts = useMemo(() => {
    let result = rawProducts

    // Filter by Category
    if (selectedCategory !== 'all') {
      result = result.filter((p) => p.categoryId === selectedCategory)
    }

    // Filter by Search Query
    const normalizedQuery = searchQuery.trim().toLowerCase()
    if (normalizedQuery) {
      const terms = normalizedQuery.split(/\s+/).filter(Boolean)
      result = result.filter((p) => {
        const catObj = categories.find((c) => c.id === p.categoryId) || SAMPLE_CATEGORIES.find((c) => c.id === p.categoryId)
        const storeObj = stores.find((s) => s.id === p.storeId) || SAMPLE_STORES.find((s) => s.id === p.storeId)
        const searchableText = `${p.name} ${p.pack || ''} ${catObj?.name || ''} ${storeObj?.name || ''}`.toLowerCase()
        return terms.every((term) => searchableText.includes(term))
      })
    }

    return result
  }, [rawProducts, selectedCategory, searchQuery, categories, stores])

  const handleResetFilters = () => {
    setSelectedCategory('all')
    setSearchQuery('')
  }

  const selectedCategoryName = (categories.find((c) => c.id === selectedCategory) || SAMPLE_CATEGORIES.find((c) => c.id === selectedCategory))?.name

  return (
    <div className="mx-auto max-w-6xl px-4 pt-6 pb-32 md:px-6 md:pt-8 md:pb-20 space-y-6">
      {/* Greeting & Header Banner */}
      <section aria-labelledby="catalogue-heading" className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge tone="brand" size="sm" className="gap-1">
                <Sparkles className="size-3 text-fresh-ink" aria-hidden="true" />
                <span>Campus Delivery</span>
              </Badge>
            </div>
            <h1 id="catalogue-heading" className="font-display text-3xl sm:text-4xl font-bold tracking-display text-ink">
              Hi {firstName}, what do you need?
            </h1>
          </div>
        </div>
      </section>

      {/* Search & Categories Bar */}
      <section aria-label="Search and category filters" className="space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <CatalogueSearch
            id="catalogue-search-input"
            value={searchQuery}
            onChange={setSearchQuery}
            onClear={() => setSearchQuery('')}
            className="flex-1"
          />
        </div>

        {/* Category Pills */}
        <CategoryPills
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
          products={rawProducts}
          categories={categories}
        />

        {/* Active Filter Chips */}
        {(selectedCategory !== 'all' || searchQuery) && (
          <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
            <span className="text-ink-subtle font-medium">Active filters:</span>
            {selectedCategory !== 'all' && (
              <span className="inline-flex items-center gap-1 rounded-full bg-surface-2 border border-line px-2.5 py-1 text-ink">
                Category: <strong className="font-semibold">{selectedCategoryName}</strong>
                <button
                  type="button"
                  onClick={() => setSelectedCategory('all')}
                  aria-label="Remove category filter"
                  className="rounded-full p-0.5 hover:bg-line text-ink-subtle hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                >
                  <X className="size-3" />
                </button>
              </span>
            )}
            {searchQuery && (
              <span className="inline-flex items-center gap-1 rounded-full bg-surface-2 border border-line px-2.5 py-1 text-ink">
                Search: <strong className="font-semibold">&ldquo;{searchQuery}&rdquo;</strong>
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  aria-label="Clear search query"
                  className="rounded-full p-0.5 hover:bg-line text-ink-subtle hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                >
                  <X className="size-3" />
                </button>
              </span>
            )}
            <button
              type="button"
              onClick={handleResetFilters}
              className="text-xs font-semibold text-brand underline-offset-4 hover:underline ml-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand rounded-sm"
            >
              Clear all
            </button>
          </div>
        )}
      </section>

      {/* Catalogue Grid */}
      <section aria-label="Available products" className="pt-2">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-xl font-bold text-ink">
            {selectedCategory === 'all'
              ? 'All Products'
              : selectedCategoryName || 'Products'}
          </h2>
          <span className="text-xs text-ink-subtle font-medium">
            {filteredProducts.length} item{filteredProducts.length === 1 ? '' : 's'}
          </span>
        </div>

        <ProductGrid
          products={filteredProducts}
          isLoading={isLoadingProducts}
          isError={isProductsError}
          error={productsError}
          onRetry={() => refetchProducts()}
          searchQuery={searchQuery}
          selectedCategory={selectedCategory}
          onResetFilters={handleResetFilters}
        />
      </section>

      {/* Floating Quick Cart Summary Bar */}
      <QuickCartBar />
    </div>
  )
}
