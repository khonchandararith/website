'use client';

import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { ProductCard } from './ProductCard';
import type { Product } from '@/lib/types';

interface ProductGridProps {
  products: Product[];
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export function ProductGrid({ products, searchQuery, onSearchChange }: ProductGridProps) {
  return (
    <section id="products" className="py-8 sm:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
              Software License Keys
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              {products.length} product{products.length !== 1 ? 's' : ''} available
            </p>
          </div>

          {/* Search */}
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10 bg-white/5 border-white/10 focus:border-blue-500/50 h-10"
              id="product-search"
            />
          </div>
        </div>

        {/* Grid */}
        {products.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product, index) => (
              <div
                key={product.id}
                className="animate-fade-in-up"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <p className="text-muted-foreground text-lg">No products found</p>
            <p className="text-muted-foreground text-sm mt-1">Try a different search or category</p>
          </div>
        )}
      </div>
    </section>
  );
}
