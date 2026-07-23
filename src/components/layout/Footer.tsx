import { Key, Shield, Zap, HeadphonesIcon } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t border-white/5 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <Key className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg font-bold gradient-text">RITH STORE LICENCE</span>
            </div>
            <p className="text-sm text-muted-foreground max-w-xs">
              Your trusted source for genuine software license keys. Instant digital delivery with secure KHQR payment.
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Quick Links
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="/#products" className="text-muted-foreground hover:text-foreground transition-colors">
                  All Products
                </a>
              </li>
              <li>
                <a href="/#categories" className="text-muted-foreground hover:text-foreground transition-colors">
                  Categories
                </a>
              </li>
              <li>
                <a href="/admin" className="text-muted-foreground hover:text-foreground transition-colors">
                  Admin Panel
                </a>
              </li>
            </ul>
          </div>

          {/* Trust */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Why Choose Us
            </h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-2 text-muted-foreground">
                <Zap className="w-4 h-4 text-blue-400" />
                Instant Digital Delivery
              </li>
              <li className="flex items-center gap-2 text-muted-foreground">
                <Shield className="w-4 h-4 text-green-400" />
                100% Authentic Keys
              </li>
              <li className="flex items-center gap-2 text-muted-foreground">
                <HeadphonesIcon className="w-4 h-4 text-purple-400" />
                24/7 Customer Support
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-white/5 text-center">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} RITH STORE LICENCE. All rights reserved. Powered by KHQR.
          </p>
        </div>
      </div>
    </footer>
  );
}
