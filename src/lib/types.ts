// ============================================
// RITH STORE LICENCE — TypeScript Types
// ============================================

export type UserRole = 'admin' | 'customer';
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'expired';

export interface Profile {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  role: UserRole;
  created_at: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string;
  created_at: string;
}

export interface Product {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  price_usd: number;
  price_khr: number;
  category_id: string | null;
  image_url: string | null;
  is_active: boolean;
  created_at: string;
  // Joined fields
  category?: Category;
  stock_count?: number;
}

export interface LicenseKey {
  id: string;
  product_id: string;
  key_code: string;
  is_sold: boolean;
  order_id: string | null;
  created_at: string;
  // Joined
  product?: Product;
}

export interface Order {
  id: string;
  user_id: string | null;
  customer_email: string | null;
  customer_name: string | null;
  total_usd: number;
  total_khr: number;
  payment_status: PaymentStatus;
  khqr_md5: string | null;
  khqr_string: string | null;
  expires_at: string | null;
  created_at: string;
  // Joined
  order_items?: OrderItem[];
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  key_id: string | null;
  price_usd: number;
  created_at: string;
  // Joined
  product?: Product;
  license_key?: LicenseKey;
}

// Cart types (client-side only)
export interface CartItem {
  product: Product;
  quantity: number;
}

export interface CartState {
  items: CartItem[];
  addItem: (product: Product) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  getTotalUSD: () => number;
  getTotalKHR: () => number;
  getItemCount: () => number;
}

// KHQR types
export interface KHQRPaymentData {
  orderId: string;
  qrString: string;
  qrDataUrl: string;
  deepLink: string;
  totalUsd: number;
  totalKhr: number;
  expiresAt: string;
}

// Checkout request
export interface CheckoutRequest {
  items: { productId: string; quantity: number }[];
  customerEmail?: string;
  customerName?: string;
}

// Admin analytics
export interface DashboardStats {
  totalRevenue: number;
  totalRevenueKhr: number;
  totalKeysSold: number;
  availableStock: number;
  pendingOrders: number;
  totalOrders: number;
}
