'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Order } from '@/lib/types';

export function useRealtimeOrder(orderId: string | null) {
  const [order, setOrder] = useState<Order | null>(null);
  const [isPaid, setIsPaid] = useState(false);

  useEffect(() => {
    if (!orderId) return;

    const supabase = createClient();

    // Initial fetch
    const fetchOrder = async () => {
      const { data } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single();

      if (data) {
        setOrder(data as Order);
        if (data.payment_status === 'paid') {
          setIsPaid(true);
        }
      }
    };

    fetchOrder();

    // Subscribe to changes
    const channel = supabase
      .channel(`order-${orderId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `id=eq.${orderId}`,
        },
        (payload) => {
          const updated = payload.new as Order;
          setOrder(updated);
          if (updated.payment_status === 'paid') {
            setIsPaid(true);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [orderId]);

  return { order, isPaid };
}
