'use client';

import { useEffect, useState } from 'react';
import { Receipt, RefreshCw, Eye, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { createClient } from '@/lib/supabase/client';
import type { Order, OrderItem } from '@/lib/types';
import { toast } from 'sonner';

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  paid: 'bg-green-500/10 text-green-400 border-green-500/20',
  failed: 'bg-red-500/10 text-red-400 border-red-500/20',
  expired: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [detailOpen, setDetailOpen] = useState(false);

  useEffect(() => {
    fetchOrders();
    // Subscribe to realtime updates
    const supabase = createClient();
    const channel = supabase
      .channel('admin-orders')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        () => {
          fetchOrders();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchOrders = async () => {
    try {
      const supabase = createClient();
      const { data } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (data) setOrders(data);
    } catch {
      // Supabase not configured
    }
  };

  const handleViewOrder = async (order: Order) => {
    setSelectedOrder(order);
    setDetailOpen(true);

    try {
      const supabase = createClient();
      const { data } = await supabase
        .from('order_items')
        .select('*, products(title), license_keys(key_code)')
        .eq('order_id', order.id);

      if (data) {
        const mapped = data.map((item: Record<string, unknown>) => ({
          ...item,
          product: Array.isArray(item.products) ? item.products[0] : item.products,
          license_key: Array.isArray(item.license_keys) ? item.license_keys[0] : item.license_keys,
        })) as OrderItem[];
        setOrderItems(mapped);
      }
    } catch {
      // Error
    }
  };

  const handleSimulatePayment = async (orderId: string) => {
    try {
      const response = await fetch(`/api/orders/${orderId}/simulate-payment`, {
        method: 'POST',
      });
      const data = await response.json();

      if (response.ok) {
        toast.success('Payment simulated successfully!');
        fetchOrders();
      } else {
        toast.error(data.error || 'Simulation failed');
      }
    } catch {
      toast.error('Failed to simulate payment');
    }
  };

  const filteredOrders =
    filter === 'all' ? orders : orders.filter((o) => o.payment_status === filter);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Orders</h1>
          <p className="text-sm text-muted-foreground mt-1">Transaction history & management</p>
        </div>
        <Button variant="outline" className="border-white/10" onClick={fetchOrders}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      <Tabs value={filter} onValueChange={setFilter}>
        <TabsList className="bg-white/5 border border-white/10">
          <TabsTrigger value="all" className="text-xs data-[state=active]:bg-white/10">
            All ({orders.length})
          </TabsTrigger>
          <TabsTrigger value="pending" className="text-xs data-[state=active]:bg-yellow-500/10 data-[state=active]:text-yellow-400">
            Pending ({orders.filter((o) => o.payment_status === 'pending').length})
          </TabsTrigger>
          <TabsTrigger value="paid" className="text-xs data-[state=active]:bg-green-500/10 data-[state=active]:text-green-400">
            Paid ({orders.filter((o) => o.payment_status === 'paid').length})
          </TabsTrigger>
          <TabsTrigger value="expired" className="text-xs data-[state=active]:bg-gray-500/10 data-[state=active]:text-gray-400">
            Expired ({orders.filter((o) => o.payment_status === 'expired').length})
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <Card className="glass-card border-white/5">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-white/5">
                <TableHead className="text-xs">Order ID</TableHead>
                <TableHead className="text-xs">Customer</TableHead>
                <TableHead className="text-xs">Amount</TableHead>
                <TableHead className="text-xs">Status</TableHead>
                <TableHead className="text-xs">Date</TableHead>
                <TableHead className="text-xs text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.map((order) => (
                <TableRow key={order.id} className="border-white/5">
                  <TableCell className="text-xs font-mono">{order.id.slice(0, 8)}...</TableCell>
                  <TableCell className="text-xs">
                    <div>
                      <div>{order.customer_name || 'Guest'}</div>
                      {order.customer_email && (
                        <div className="text-[10px] text-muted-foreground">{order.customer_email}</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-xs font-medium">${Number(order.total_usd).toFixed(2)}</TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={`text-[10px] capitalize ${statusColors[order.payment_status]}`}
                    >
                      {order.payment_status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {new Date(order.created_at).toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 hover:bg-white/5"
                        onClick={() => handleViewOrder(order)}
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </Button>
                      {order.payment_status === 'pending' && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 hover:bg-green-500/10 text-green-400"
                          title="Simulate payment (dev only)"
                          onClick={() => handleSimulatePayment(order.id)}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filteredOrders.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-muted-foreground text-sm">
                    No orders found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Order Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="sm:max-w-lg bg-background/95 backdrop-blur-xl border-white/10">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Receipt className="w-5 h-5 text-blue-400" />
              Order Details
            </DialogTitle>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-4 mt-2">
              <div className="glass rounded-xl p-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Order ID</span>
                  <span className="font-mono text-xs">{selectedOrder.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Customer</span>
                  <span>{selectedOrder.customer_name || 'Guest'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Email</span>
                  <span>{selectedOrder.customer_email || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Amount</span>
                  <span className="font-bold">${Number(selectedOrder.total_usd).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status</span>
                  <Badge
                    variant="outline"
                    className={`text-[10px] capitalize ${statusColors[selectedOrder.payment_status]}`}
                  >
                    {selectedOrder.payment_status}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Date</span>
                  <span className="text-xs">{new Date(selectedOrder.created_at).toLocaleString()}</span>
                </div>
              </div>

              {/* Order Items */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Items</h4>
                {orderItems.map((item) => (
                  <div key={item.id} className="glass rounded-lg p-3 space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>{item.product?.title || 'Unknown Product'}</span>
                      <span className="font-medium">${Number(item.price_usd).toFixed(2)}</span>
                    </div>
                    {item.license_key && (
                      <div className="text-xs font-mono text-green-400 bg-green-500/10 px-2 py-1 rounded">
                        {item.license_key.key_code}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
