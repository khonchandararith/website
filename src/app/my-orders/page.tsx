'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Key,
  Copy,
  Clock,
  CheckCircle2,
  XCircle,
  ShoppingBag,
  ExternalLink,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useUser } from '@/hooks/useUser';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

interface OrderItemWithKey {
  id: string;
  price_usd: number;
  products: {
    title: string;
    image_url: string | null;
  } | null;
  license_keys: {
    key_code: string;
  } | null;
}

interface OrderWithItems {
  id: string;
  total_usd: number;
  total_khr: number;
  payment_status: 'pending' | 'paid' | 'failed' | 'expired';
  created_at: string;
  order_items: OrderItemWithKey[];
}

export default function MyOrdersPage() {
  const { user, loading: authLoading } = useUser();
  const router = useRouter();
  const [orders, setOrders] = useState<OrderWithItems[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        setLoading(false);
        return;
      }

      const response = await fetch('/api/user/orders', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      const data = await response.json();
      if (response.ok) {
        setOrders(data.orders || []);
      } else {
        toast.error(data.error || 'Failed to load orders');
      }
    } catch (err) {
      console.error(err);
      toast.error('Error connecting to server');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login?redirect=/my-orders');
      return;
    }

    if (user) {
      fetchOrders();
    }
  }, [user, authLoading, router, fetchOrders]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('License key copied to clipboard!');
  };

  if (authLoading || (loading && orders.length === 0)) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <ShoppingBag className="w-8 h-8 text-blue-500" />
            My Purchased Keys & Orders
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            View all your past orders, payment statuses, and license keys
          </p>
        </div>
        <Button
          onClick={fetchOrders}
          variant="outline"
          size="sm"
          className="border-white/10 hover:bg-white/5 self-start sm:self-auto"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Orders List */}
      {orders.length === 0 ? (
        <Card className="bg-background/95 backdrop-blur-xl border-white/10 text-center py-12">
          <CardContent className="space-y-4">
            <div className="w-16 h-16 rounded-full bg-blue-500/10 flex items-center justify-center mx-auto">
              <Key className="w-8 h-8 text-blue-400" />
            </div>
            <h2 className="text-xl font-bold">No Purchases Found</h2>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              You haven&apos;t placed any orders yet. Browse our store to find software license keys!
            </p>
            <Link href="/#products">
              <Button className="bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0 shadow-lg mt-2">
                Browse Products
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => {
            const isPaid = order.payment_status === 'paid';
            const isPending = order.payment_status === 'pending';
            const isExpired = order.payment_status === 'expired';
            const orderItems = order.order_items || [];
            const totalUsd = order.total_usd || 0;

            return (
              <Card
                key={order.id}
                className="bg-background/95 backdrop-blur-xl border-white/10 overflow-hidden hover:border-white/20 transition-all"
              >
                <CardHeader className="bg-white/5 border-b border-white/5 py-4">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-mono text-muted-foreground">
                          ID: {order.id ? order.id.slice(0, 8) : 'N/A'}...
                        </span>
                        <Badge
                          className={`text-xs px-2.5 py-0.5 font-semibold ${
                            isPaid
                              ? 'bg-green-500/20 text-green-400 border-green-500/30'
                              : isPending
                              ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                              : 'bg-red-500/20 text-red-400 border-red-500/30'
                          }`}
                        >
                          {isPaid && <CheckCircle2 className="w-3 h-3 mr-1 inline" />}
                          {isPending && <Clock className="w-3 h-3 mr-1 inline animate-pulse" />}
                          {isExpired && <XCircle className="w-3 h-3 mr-1 inline" />}
                          {(order.payment_status || 'pending').toUpperCase()}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Placed on {order.created_at ? new Date(order.created_at).toLocaleString() : 'N/A'}
                      </p>
                    </div>

                    <div className="text-right">
                      <div className="text-lg font-bold gradient-text">
                        ${totalUsd.toFixed(2)} USD
                      </div>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="p-6 space-y-4">
                  {/* Order Items & Revealed Keys */}
                  <div className="space-y-3">
                    {orderItems.length === 0 ? (
                      <p className="text-xs text-muted-foreground">No item details available.</p>
                    ) : (
                      orderItems.map((item) => {
                        const title = item?.products?.title || 'Software License';
                        const keyCode = item?.license_keys?.key_code;
                        const itemPrice = item?.price_usd || 0;

                        return (
                          <div
                            key={item.id}
                            className="glass rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                          >
                            <div className="space-y-1">
                              <h4 className="font-semibold text-foreground flex items-center gap-2">
                                <Key className="w-4 h-4 text-blue-400" />
                                {title}
                              </h4>
                              <p className="text-xs text-muted-foreground">
                                Price: ${itemPrice.toFixed(2)}
                              </p>
                            </div>

                            {/* Key Display */}
                            {isPaid && keyCode ? (
                              <div className="flex items-center gap-2 bg-black/40 border border-green-500/30 px-3 py-2 rounded-lg">
                                <code className="text-sm font-mono text-green-400 font-bold select-all">
                                  {keyCode}
                                </code>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-7 w-7 text-green-400 hover:bg-green-500/20"
                                  onClick={() => copyToClipboard(keyCode)}
                                  title="Copy Key"
                                >
                                  <Copy className="w-3.5 h-3.5" />
                                </Button>
                              </div>
                            ) : isPaid && !keyCode ? (
                              <Badge variant="outline" className="text-xs text-amber-400 border-amber-500/30">
                                Key Assigning...
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-xs text-muted-foreground border-white/10">
                                Locked (Complete Payment)
                              </Badge>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
