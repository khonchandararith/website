'use client';

import Link from 'next/link';
import { ShoppingCart, Zap, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCart } from '@/hooks/useCart';
import type { Product } from '@/lib/types';
import { toast } from 'sonner';

import { formatImageUrl } from '@/lib/utils';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const addItem = useCart((state) => state.addItem);
  const inStock = (product.stock_count ?? 0) > 0;
  const imageUrl = formatImageUrl(product.image_url);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!inStock) return;
    addItem(product);
    toast.success(`${product.title} added to cart`);
  };

  return (
    <Link href={`/products/${product.slug}`} className="block group">
      <div className="glass-card rounded-2xl overflow-hidden h-full flex flex-col">
        {/* Image */}
        <div className="relative aspect-[4/3] bg-gradient-to-br from-white/5 to-white/2 overflow-hidden">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={product.title}
              referrerPolicy="no-referrer"
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <Package className="w-16 h-16 text-muted-foreground/30" />
            </div>
          )}

          {/* Badge overlays */}
          <div className="absolute top-3 left-3 flex gap-2">
            <Badge className="bg-blue-500/90 text-white border-0 text-[10px] backdrop-blur-sm">
              <Zap className="w-3 h-3 mr-1" />
              Instant
            </Badge>
          </div>

          {!inStock && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
              <span className="text-sm font-semibold text-white/80">Out of Stock</span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-5 flex flex-col flex-1">
          <h3 className="text-sm font-semibold text-foreground group-hover:text-blue-400 transition-colors line-clamp-2 mb-2">
            {product.title}
          </h3>

          {product.description && (
            <p className="text-xs text-muted-foreground line-clamp-2 mb-4 flex-1">
              {product.description}
            </p>
          )}

          <div className="flex items-end justify-between mt-auto">
            <div>
              <div className="text-xl font-bold text-foreground">
                ${product.price_usd.toFixed(2)}
              </div>
              {product.price_khr > 0 && (
                <div className="text-xs text-muted-foreground">
                  ៛{product.price_khr.toLocaleString()} KHR
                </div>
              )}
            </div>

            <Button
              size="sm"
              disabled={!inStock}
              onClick={handleAddToCart}
              className="bg-blue-600 hover:bg-blue-500 text-white border-0 h-9 px-3 shadow-md shadow-blue-500/20"
            >
              <ShoppingCart className="w-4 h-4 mr-1" />
              Add
            </Button>
          </div>
        </div>
      </div>
    </Link>
  );
}
