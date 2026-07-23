'use client';

import { useEffect, useState } from 'react';
import {
  DollarSign,
  Key,
  Package,
  Clock,
  TrendingUp,
  ShoppingCart,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { createClient } from '@/lib/supabase/client';
import type { DashboardStats, Order } from '@/lib/types';

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  paid: 'bg-green-500/10 text-green-400 border-green-500/20',
  failed: 'bg-red-500/10 text-red-400 border-red-500/20',
  expired: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
};

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalRevenue: 0,
    totalRevenueKhr: 0,
    totalKeysSold: 0,
    availableStock: 0,
    pendingOrders: 0,
    totalOrders: 0,
  });
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const supabase = createClient();

        // Revenue from paid orders
        const { data: paidOrders } = await supabase
          .from('orders')
          .select('total_usd, total_khr')
          .eq('payment_status', 'paid');

        const totalRevenue = paidOrders?.reduce((sum, o) => sum + Number(o.total_usd), 0) || 0;
        const totalRevenueKhr = paidOrders?.reduce((sum, o) => sum + Number(o.total_khr), 0) || 0;

        // Keys sold
        const { count: keysSold } = await supabase
          .from('license_keys')
          .select('*', { count: 'exact', head: true })
          .eq('is_sold', true);

        // Available stock
        const { count: availableStock } = await supabase
          .from('license_keys')
          .select('*', { count: 'exact', head: true })
          .eq('is_sold', false);

        // Pending orders
        const { count: pendingOrders } = await supabase
          .from('orders')
          .select('*', { count: 'exact', head: true })
          .eq('payment_status', 'pending');

        // Total orders
        const { count: totalOrders } = await supabase
          .from('orders')
          .select('*', { count: 'exact', head: true });

        setStats({
          totalRevenue,
          totalRevenueKhr,
          totalKeysSold: keysSold || 0,
          availableStock: availableStock || 0,
          pendingOrders: pendingOrders || 0,
          totalOrders: totalOrders || 0,
        });

        // Recent orders
        const { data: orders } = await supabase
          .from('orders')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(10);

        if (orders) setRecentOrders(orders);
      } catch {
        // Supabase not configured
      }
    };

    fetchData();
  }, []);

  const statCards = [
    {
      title: 'Total Revenue',
      value: `$${stats.totalRevenue.toFixed(2)}`,
      subtitle: `៛${stats.totalRevenueKhr.toLocaleString()} KHR`,
      icon: DollarSign,
      color: 'text-green-400',
      bgColor: 'from-green-500/10 to-green-500/5',
    },
    {
      title: 'Keys Sold',
      value: stats.totalKeysSold.toString(),
      subtitle: `${stats.totalOrders} total orders`,
      icon: Key,
      color: 'text-blue-400',
      bgColor: 'from-blue-500/10 to-blue-500/5',
    },
    {
      title: 'Available Stock',
      value: stats.availableStock.toString(),
      subtitle: 'License keys in inventory',
      icon: Package,
      color: 'text-purple-400',
      bgColor: 'from-purple-500/10 to-purple-500/5',
    },
    {
      title: 'Pending Orders',
      value: stats.pendingOrders.toString(),
      subtitle: 'Awaiting payment',
      icon: Clock,
      color: 'text-yellow-400',
      bgColor: 'from-yellow-500/10 to-yellow-500/5',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Overview of your store performance
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <Card key={stat.title} className="glass-card border-white/5">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                    {stat.title}
                  </p>
                  <p className="text-2xl font-bold mt-2 text-foreground">{stat.value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{stat.subtitle}</p>
                </div>
                <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${stat.bgColor} flex items-center justify-center`}>
                  <stat.icon className={`w-5 h-5 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Orders */}
      <Card className="glass-card border-white/5">
        <CardHeader>
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <ShoppingCart className="w-4 h-4 text-blue-400" />
            Recent Transactions
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentOrders.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow className="border-white/5">
                  <TableHead className="text-xs">Order ID</TableHead>
                  <TableHead className="text-xs">Customer</TableHead>
                  <TableHead className="text-xs">Amount</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                  <TableHead className="text-xs">Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentOrders.map((order) => (
                  <TableRow key={order.id} className="border-white/5">
                    <TableCell className="text-xs font-mono">
                      {order.id.slice(0, 8)}...
                    </TableCell>
                    <TableCell className="text-xs">
                      {order.customer_name || order.customer_email || 'Guest'}
                    </TableCell>
                    <TableCell className="text-xs font-medium">
                      ${Number(order.total_usd).toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`text-[10px] capitalize ${statusColors[order.payment_status]}`}
                      >
                        {order.payment_status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(order.created_at).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12">
              <TrendingUp className="w-12 h-12 text-muted-foreground/20 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No transactions yet</p>
              <p className="text-xs text-muted-foreground mt-1">
                Orders will appear here once customers start purchasing
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
