'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  ShoppingCart,
  Zap,
  Shield,
  CheckCircle,
  Package,
  Key,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { useCart } from '@/hooks/useCart';
import { createClient } from '@/lib/supabase/client';
import { CheckoutDialog } from '@/components/checkout/CheckoutDialog';
import type { Product } from '@/lib/types';
import { toast } from 'sonner';

export default function ProductDetailPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [imageError, setImageError] = useState(false);
  const addItem = useCart((s) => s.addItem);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await fetch(`/api/products/${slug}`);
        if (res.ok) {
          const data = await res.json();
          if (data.product) {
            setProduct(data.product as Product);
            setImageError(false);
          }
        }
      } catch {
        // Product not found
      }
      setLoading(false);
    };

    fetchProduct();
  }, [slug]);

  const handleAddToCart = () => {
    if (!product) return;
    addItem(product);
    toast.success(`${product.title} added to cart`);
  };

  const handleBuyNow = () => {
    if (!product) return;
    addItem(product);
    setCheckoutOpen(true);
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="animate-pulse space-y-8">
            <div className="h-8 w-48 bg-white/5 rounded-lg" />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              <div className="aspect-square bg-white/5 rounded-2xl" />
              <div className="space-y-4">
                <div className="h-10 w-3/4 bg-white/5 rounded-lg" />
                <div className="h-6 w-1/2 bg-white/5 rounded-lg" />
                <div className="h-24 bg-white/5 rounded-lg" />
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  if (!product) {
    return (
      <>
        <Navbar />
        <main className="flex-1 flex items-center justify-center py-32">
          <div className="text-center space-y-4">
            <Package className="w-16 h-16 text-muted-foreground/20 mx-auto" />
            <h1 className="text-2xl font-bold">Product Not Found</h1>
            <p className="text-muted-foreground">This product may have been removed or doesn't exist.</p>
            <Link href="/">
              <Button variant="outline" className="border-white/10">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Store
              </Button>
            </Link>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  const inStock = (product.stock_count ?? 0) > 0;

  return (
    <>
      <Navbar />
      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Breadcrumb */}
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Store
          </Link>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Image */}
            <div className="glass-card rounded-2xl aspect-square flex items-center justify-center relative overflow-hidden p-4">
              {product.image_url && !imageError ? (
                <img
                  src={product.image_url}
                  alt={product.title}
                  className="w-full h-full object-cover rounded-xl"
                  onError={() => setImageError(true)}
                />
              ) : (
                <div className="text-center space-y-4 p-8">
                  <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center mx-auto">
                    <Key className="w-12 h-12 text-blue-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-muted-foreground">{product.title}</h3>
                </div>
              )}
            </div>

            {/* Details */}
            <div className="space-y-6">
              {/* Category badge */}
              {product.category && (
                <Badge variant="outline" className="border-blue-500/30 text-blue-400">
                  {product.category.name}
                </Badge>
              )}

              <h1 className="text-3xl sm:text-4xl font-bold text-foreground">
                {product.title}
              </h1>

              {/* Price */}
              <div className="space-y-1">
                <div className="text-4xl font-bold gradient-text">
                  ${product.price_usd.toFixed(2)}
                </div>
                {product.price_khr > 0 && (
                  <div className="text-base text-muted-foreground">
                    ≈ ៛{product.price_khr.toLocaleString()} KHR
                  </div>
                )}
              </div>

              <Separator className="bg-white/5" />

              {/* Description */}
              {product.description && (
                <p className="text-muted-foreground leading-relaxed">
                  {product.description}
                </p>
              )}

              {/* Features */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <Zap className="w-4 h-4 text-blue-400" />
                  <span>Instant Digital Delivery</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Shield className="w-4 h-4 text-green-400" />
                  <span>100% Genuine & Authentic Key</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="w-4 h-4 text-purple-400" />
                  <span>Lifetime Activation Guaranteed</span>
                </div>
              </div>

              {/* Stock */}
              <div className="glass rounded-xl p-4">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${inStock ? 'bg-green-400' : 'bg-red-400'}`} />
                  <span className={`text-sm font-medium ${inStock ? 'text-green-400' : 'text-red-400'}`}>
                    {inStock ? `In Stock (${product.stock_count} available)` : 'Out of Stock'}
                  </span>
                </div>
              </div>

              {/* CTA Buttons */}
              <div className="flex gap-3">
                <Button
                  size="lg"
                  disabled={!inStock}
                  onClick={handleAddToCart}
                  variant="outline"
                  className="flex-1 border-white/10 hover:bg-white/5 h-12"
                >
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  Add to Cart
                </Button>
                <Button
                  size="lg"
                  disabled={!inStock}
                  onClick={handleBuyNow}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white border-0 h-12 shadow-lg shadow-blue-500/25"
                >
                  <Zap className="w-4 h-4 mr-2" />
                  Buy Now
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
      <CheckoutDialog open={checkoutOpen} onOpenChange={setCheckoutOpen} />
    </>
  );
}
