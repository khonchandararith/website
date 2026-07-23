import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, QrCode } from 'lucide-react';
import { useCart } from '@/hooks/useCart';
import { KHQRPaymentModal } from './KHQRPaymentModal';
import type { KHQRPaymentData } from '@/lib/types';
import { toast } from 'sonner';

interface CheckoutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

import { useUser } from '@/hooks/useUser';
import { createClient } from '@/lib/supabase/client';

export function CheckoutDialog({ open, onOpenChange }: CheckoutDialogProps) {
  const { items, clearCart } = useCart();
  const { user, profile } = useUser();
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [paymentData, setPaymentData] = useState<KHQRPaymentData | null>(null);

  useEffect(() => {
    if (user && !customerEmail) {
      setCustomerEmail(user.email || '');
    }
    if (profile?.full_name && !customerName) {
      setCustomerName(profile.full_name);
    }
  }, [user, profile, customerEmail, customerName]);

  const handleCheckout = async () => {
    if (items.length === 0) return;

    setLoading(true);
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }

      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          items: items.map((item) => ({
            productId: item.product.id,
            quantity: item.quantity,
          })),
          customerName: customerName || profile?.full_name || undefined,
          customerEmail: customerEmail || user?.email || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || 'Checkout failed');
        return;
      }

      setPaymentData({
        orderId: data.orderId,
        qrString: data.qrString,
        qrDataUrl: data.qrDataUrl,
        deepLink: data.deepLink,
        totalUsd: data.totalUsd,
        totalKhr: data.totalKhr,
        expiresAt: data.expiresAt,
      });
    } catch (error) {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccess = () => {
    clearCart();
    setPaymentData(null);
    setCustomerName('');
    setCustomerEmail('');
    onOpenChange(false);
  };

  const handleClose = () => {
    if (!paymentData) {
      onOpenChange(false);
    }
  };

  // Show KHQR payment modal if we have payment data
  if (paymentData) {
    return (
      <KHQRPaymentModal
        paymentData={paymentData}
        onSuccess={handlePaymentSuccess}
        onClose={() => {
          setPaymentData(null);
          onOpenChange(false);
        }}
      />
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md bg-background/95 backdrop-blur-xl border-white/10">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold flex items-center gap-2">
            <QrCode className="w-5 h-5 text-blue-400" />
            Checkout — Pay with KHQR
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">
              Name <span className="text-xs">(optional)</span>
            </label>
            <Input
              placeholder="Your name"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="bg-white/5 border-white/10 focus:border-blue-500/50"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">
              Email <span className="text-xs">(for receipt, optional)</span>
            </label>
            <Input
              type="email"
              placeholder="your@email.com"
              value={customerEmail}
              onChange={(e) => setCustomerEmail(e.target.value)}
              className="bg-white/5 border-white/10 focus:border-blue-500/50"
            />
          </div>

          <div className="glass rounded-xl p-4 space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">Order Summary</h4>
            {items.map((item) => (
              <div key={item.product.id} className="flex justify-between text-sm">
                <span className="text-foreground truncate mr-4">
                  {item.product.title} × {item.quantity}
                </span>
                <span className="text-foreground font-medium shrink-0">
                  ${(item.product.price_usd * item.quantity).toFixed(2)}
                </span>
              </div>
            ))}
            <div className="border-t border-white/5 mt-2 pt-2 flex justify-between">
              <span className="text-sm font-bold">Total</span>
              <span className="text-base font-bold gradient-text">
                ${items.reduce((t, i) => t + i.product.price_usd * i.quantity, 0).toFixed(2)}
              </span>
            </div>
          </div>

          <Button
            onClick={handleCheckout}
            disabled={loading || items.length === 0}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white border-0 h-12 text-base font-semibold shadow-lg shadow-blue-500/25"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating KHQR...
              </>
            ) : (
              <>
                <QrCode className="w-4 h-4 mr-2" />
                Generate KHQR Payment Code
              </>
            )}
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            Scan the QR code with Bakong, ABA, or any KHQR-supported app
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
