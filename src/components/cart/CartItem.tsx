'use client';

import { Minus, Plus, Trash2, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCart } from '@/hooks/useCart';
import type { CartItem as CartItemType } from '@/lib/types';
import { formatImageUrl } from '@/lib/utils';

interface CartItemProps {
  item: CartItemType;
}

export function CartItem({ item }: CartItemProps) {
  const { updateQuantity, removeItem } = useCart();
  const imageUrl = formatImageUrl(item.product.image_url);

  return (
    <div className="flex gap-3 p-3 glass-card rounded-xl items-center">
      {/* Thumbnail */}
      <div className="w-12 h-12 rounded-lg bg-white/5 flex items-center justify-center overflow-hidden shrink-0 border border-white/10">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={item.product.title}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover"
          />
        ) : (
          <Package className="w-5 h-5 text-muted-foreground/30" />
        )}
      </div>
      {/* Product info */}
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-medium text-foreground truncate">
          {item.product.title}
        </h4>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-sm font-semibold text-blue-400">
            ${item.product.price_usd.toFixed(2)}
          </span>
          {item.product.price_khr > 0 && (
            <span className="text-xs text-muted-foreground">
              ៛{item.product.price_khr.toLocaleString()}
            </span>
          )}
        </div>

        {/* Quantity controls */}
        <div className="flex items-center gap-2 mt-3">
          <Button
            variant="outline"
            size="icon"
            className="h-7 w-7 border-white/10 hover:bg-white/5"
            onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
          >
            <Minus className="w-3 h-3" />
          </Button>
          <span className="text-sm font-medium w-8 text-center">{item.quantity}</span>
          <Button
            variant="outline"
            size="icon"
            className="h-7 w-7 border-white/10 hover:bg-white/5"
            onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
          >
            <Plus className="w-3 h-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10 ml-auto"
            onClick={() => removeItem(item.product.id)}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Subtotal */}
      <div className="text-right shrink-0">
        <span className="text-sm font-bold text-foreground">
          ${(item.product.price_usd * item.quantity).toFixed(2)}
        </span>
      </div>
    </div>
  );
}
