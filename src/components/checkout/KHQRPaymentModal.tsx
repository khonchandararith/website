'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  CheckCircle2,
  Clock,
  Copy,
  XCircle,
  QrCode,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { useRealtimeOrder } from '@/hooks/useRealtimeOrder';
import type { KHQRPaymentData } from '@/lib/types';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

interface KHQRPaymentModalProps {
  paymentData: KHQRPaymentData;
  onSuccess: () => void;
  onClose: () => void;
}

export function KHQRPaymentModal({ paymentData, onSuccess, onClose }: KHQRPaymentModalProps) {
  const [timeLeft, setTimeLeft] = useState(0);
  const [expired, setExpired] = useState(false);
  const [licenseKeys, setLicenseKeys] = useState<{ title: string; keyCode: string }[]>([]);
  const { order, isPaid } = useRealtimeOrder(paymentData.orderId);

  // Calculate time left
  useEffect(() => {
    const expiresAt = new Date(paymentData.expiresAt).getTime();

    const updateTimer = () => {
      const now = Date.now();
      const remaining = Math.max(0, Math.floor((expiresAt - now) / 1000));
      setTimeLeft(remaining);
      if (remaining <= 0) {
        setExpired(true);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [paymentData.expiresAt]);

  // Polling fallback to check-payment API
  useEffect(() => {
    if (isPaid || expired) return;

    const pollPaymentStatus = async () => {
      try {
        const response = await fetch(`/api/orders/${paymentData.orderId}/check-payment`);
        const data = await response.json();
        if (data.status === 'paid') {
          toast.success('Payment verified successfully!');
        }
      } catch (error) {
        console.error('Error polling payment status:', error);
      }
    };

    // Poll every 4 seconds
    const interval = setInterval(pollPaymentStatus, 4000);
    return () => clearInterval(interval);
  }, [paymentData.orderId, isPaid, expired]);

  // Fetch license keys when payment is confirmed
  useEffect(() => {
    if (!isPaid) return;

    const fetchKeys = async () => {
      const supabase = createClient();
      const { data: items } = await supabase
        .from('order_items')
        .select('*, products(title), license_keys(key_code)')
        .eq('order_id', paymentData.orderId);

      if (items) {
        const keys = items.map((item: Record<string, unknown>) => ({
          title: (item.products as { title: string } | null)?.title || 'Product',
          keyCode: (item.license_keys as { key_code: string } | null)?.key_code || 'N/A',
        }));
        setLicenseKeys(keys);
      }
    };

    fetchKeys();
  }, [isPaid, paymentData.orderId]);

  const copyToClipboard = useCallback((text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  }, []);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const progressPercent = Math.max(0, (timeLeft / 300) * 100); // 5min = 300s

  // =============================================
  // PAID STATE
  // =============================================
  if (isPaid) {
    return (
      <Dialog open={true} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-md bg-background/95 backdrop-blur-xl border-green-500/20">
          <div className="text-center space-y-6 py-4">
            {/* Success animation */}
            <div className="relative mx-auto w-20 h-20">
              <div className="absolute inset-0 rounded-full bg-green-500/20 animate-ping" />
              <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                <CheckCircle2 className="w-10 h-10 text-white" />
              </div>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-green-400">Payment Successful!</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Your license key(s) are ready
              </p>
            </div>

            {/* License Keys */}
            <div className="space-y-3">
              {licenseKeys.map((key, index) => (
                <div key={index} className="glass rounded-xl p-4 text-left">
                  <div className="text-xs text-muted-foreground mb-1">{key.title}</div>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 text-sm font-mono text-green-400 bg-green-500/10 px-3 py-2 rounded-lg break-all">
                      {key.keyCode}
                    </code>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="shrink-0 hover:bg-green-500/10"
                      onClick={() => copyToClipboard(key.keyCode)}
                    >
                      <Copy className="w-4 h-4 text-green-400" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <Button
              onClick={onSuccess}
              className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white border-0 h-12"
            >
              Done — Continue Shopping
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // =============================================
  // EXPIRED STATE
  // =============================================
  if (expired) {
    return (
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md bg-background/95 backdrop-blur-xl border-red-500/20">
          <div className="text-center space-y-6 py-4">
            <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center mx-auto">
              <XCircle className="w-10 h-10 text-red-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-red-400">Payment Expired</h2>
              <p className="text-sm text-muted-foreground mt-1">
                The payment session has expired. Please try again.
              </p>
            </div>
            <Button
              onClick={onClose}
              variant="outline"
              className="w-full border-white/10 h-11"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // =============================================
  // PENDING STATE — Displays QR Code for all devices
  // =============================================
  return (
    <Dialog open={true} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md bg-background/95 backdrop-blur-xl border-blue-500/20">
        <div className="text-center space-y-5 py-2">
          {/* Header */}
          <div>
            <h2 className="text-lg font-bold text-foreground flex items-center justify-center gap-2">
              <QrCode className="w-5 h-5 text-blue-400" />
              Scan to Pay
            </h2>
            <p className="text-xs text-muted-foreground mt-1">
              Use Bakong, ABA, or any KHQR-supported app
            </p>
          </div>

          {/* QR Code */}
          <div className="relative mx-auto w-64 h-64 bg-white rounded-2xl p-3 shadow-2xl shadow-blue-500/10">
            <Image
              src={paymentData.qrDataUrl}
              alt="KHQR Payment QR Code"
              fill
              className="rounded-xl object-contain p-2"
            />
          </div>

          {/* Amount */}
          <div className="glass rounded-xl p-4">
            <div className="text-sm text-muted-foreground">Amount to pay</div>
            <div className="text-3xl font-bold gradient-text mt-1">
              ${paymentData.totalUsd.toFixed(2)}
            </div>
            {paymentData.totalKhr > 0 && (
              <div className="text-xs text-muted-foreground mt-0.5">
                ≈ ៛{paymentData.totalKhr.toLocaleString()} KHR
              </div>
            )}
          </div>

          {/* Timer */}
          <div className="space-y-2">
            <div className="flex items-center justify-center gap-2 text-sm">
              <Clock className={`w-4 h-4 ${timeLeft <= 60 ? 'text-red-400' : 'text-blue-400'}`} />
              <span className={`font-mono font-bold ${timeLeft <= 60 ? 'text-red-400' : 'text-foreground'}`}>
                {formatTime(timeLeft)}
              </span>
              <span className="text-muted-foreground">remaining</span>
            </div>
            <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-1000 ${
                  timeLeft <= 60
                    ? 'bg-gradient-to-r from-red-500 to-orange-500'
                    : 'bg-gradient-to-r from-blue-500 to-purple-500'
                }`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Waiting indicator */}
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
            Waiting for payment confirmation...
          </div>

          {/* Order ID */}
          <div className="text-xs text-muted-foreground">
            Order ID: <code className="text-foreground/60">{paymentData.orderId.slice(0, 8)}...</code>
          </div>

          <Button
            variant="ghost"
            onClick={onClose}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Cancel Payment
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
