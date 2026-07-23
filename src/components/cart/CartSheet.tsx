'use client';

import { useState } from 'react';
import { ShoppingCart, CreditCard, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useCart } from '@/hooks/useCart';
import { CartItem } from './CartItem';
import { CheckoutDialog } from '@/components/checkout/CheckoutDialog';

export function CartSheet() {
  const { items, getTotalUSD, getTotalKHR, getItemCount, clearCart } = useCart();
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const totalUsd = getTotalUSD();
  const totalKhr = getTotalKHR();
  const count = getItemCount();

  return (
    <>
      <div className="flex flex-col h-full">
        {/* Header */}
        <SheetHeader className="px-6 py-4 border-b border-white/5">
          <SheetTitle className="flex items-center gap-2 text-foreground">
            <ShoppingCart className="w-5 h-5" />
            Shopping Cart
            {count > 0 && (
              <span className="text-xs text-muted-foreground ml-1">
                ({count} item{count !== 1 ? 's' : ''})
              </span>
            )}
          </SheetTitle>
        </SheetHeader>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
          {items.length > 0 ? (
            items.map((item) => (
              <CartItem key={item.product.id} item={item} />
            ))
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center py-16">
              <ShoppingCart className="w-16 h-16 text-muted-foreground/20 mb-4" />
              <p className="text-muted-foreground text-sm">Your cart is empty</p>
              <p className="text-muted-foreground text-xs mt-1">
                Browse products and add them to your cart
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t border-white/5 px-6 py-4 space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-semibold">${totalUsd.toFixed(2)} USD</span>
              </div>
              {totalKhr > 0 && (
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">KHR equivalent</span>
                  <span className="text-muted-foreground">៛{totalKhr.toLocaleString()}</span>
                </div>
              )}
            </div>

            <Separator className="bg-white/5" />

            <div className="flex justify-between items-center">
              <span className="text-base font-bold">Total</span>
              <span className="text-xl font-bold gradient-text">
                ${totalUsd.toFixed(2)}
              </span>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="border-white/10 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30"
                onClick={clearCart}
              >
                <Trash2 className="w-3.5 h-3.5 mr-1" />
                Clear
              </Button>
              <Button
                className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white border-0 shadow-lg shadow-blue-500/25"
                onClick={() => setCheckoutOpen(true)}
              >
                <CreditCard className="w-4 h-4 mr-2" />
                Pay with KHQR
              </Button>
            </div>
          </div>
        )}
      </div>

      <CheckoutDialog open={checkoutOpen} onOpenChange={setCheckoutOpen} />
    </>
  );
}
