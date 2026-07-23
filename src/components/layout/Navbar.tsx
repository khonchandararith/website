'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ShoppingCart, Menu, X, Key, User as UserIcon, LogOut, ShieldCheck, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useCart } from '@/hooks/useCart';
import { useUser } from '@/hooks/useUser';
import { CartSheet } from '@/components/cart/CartSheet';
import { ThemeToggle } from '@/components/theme/ThemeToggle';

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const itemCount = useCart((state) => state.getItemCount());
  const { user, profile, isAdmin, signOut } = useUser();

  return (
    <nav className="sticky top-0 z-50 glass border-b border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="relative">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center group-hover:shadow-lg group-hover:shadow-blue-500/25 transition-all duration-300">
                <Key className="w-5 h-5 text-white" />
              </div>
            </div>
            <div className="flex flex-col">
              <span className="text-base font-bold tracking-tight gradient-text">
                RITH STORE
              </span>
              <span className="text-[10px] text-muted-foreground -mt-1 tracking-widest uppercase">
                Licence
              </span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-6">
            <Link
              href="/"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Home
            </Link>
            <Link
              href="/#products"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Products
            </Link>
            <Link
              href="/#categories"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Categories
            </Link>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-3">
            {/* Theme Toggle */}
            <ThemeToggle />

            {/* Cart */}
            <Sheet>
              <SheetTrigger
                render={
                  <Button
                    variant="ghost"
                    size="icon"
                    className="relative hover:bg-white/5"
                    id="cart-button"
                  />
                }
              >
                <ShoppingCart className="w-5 h-5" />
                {itemCount > 0 && (
                  <Badge
                    className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center bg-blue-500 text-white text-[10px] font-bold border-0 animate-fade-in-up"
                  >
                    {itemCount}
                  </Badge>
                )}
              </SheetTrigger>
              <SheetContent className="w-full sm:max-w-md bg-background/95 backdrop-blur-xl border-white/5 p-0">
                <CartSheet />
              </SheetContent>
            </Sheet>

            {/* User Account Menu */}
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger className="flex items-center gap-2 hover:bg-white/5 px-2.5 py-1.5 rounded-full cursor-pointer transition-colors outline-none border-0">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold shadow-md">
                    {(profile?.full_name || user.email || 'U')[0].toUpperCase()}
                  </div>
                  <span className="hidden sm:inline text-xs font-medium max-w-[100px] truncate">
                    {profile?.full_name || user.email?.split('@')[0]}
                  </span>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-background/95 backdrop-blur-xl border-white/10 p-1.5 z-50">
                  <div className="px-2.5 py-2 border-b border-white/10 mb-1">
                    <p className="text-sm font-medium leading-none text-foreground">{profile?.full_name || 'Customer'}</p>
                    <p className="text-xs text-muted-foreground truncate mt-1">{user.email}</p>
                  </div>

                  <DropdownMenuItem key="my-orders" onClick={() => window.location.href = '/my-orders'} className="cursor-pointer">
                    <ShoppingBag className="w-4 h-4 mr-2 text-blue-400" />
                    My Keys & Orders
                  </DropdownMenuItem>

                  {isAdmin && (
                    <DropdownMenuItem key="admin-dashboard" onClick={() => window.location.href = '/admin'} className="text-purple-400 cursor-pointer">
                      <ShieldCheck className="w-4 h-4 mr-2" />
                      Admin Dashboard
                    </DropdownMenuItem>
                  )}

                  <DropdownMenuSeparator className="bg-white/10 my-1" />
                  <DropdownMenuItem onClick={signOut} className="text-red-400 hover:text-red-300 cursor-pointer">
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link href="/login">
                <Button variant="default" size="sm" className="bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0 shadow-md">
                  <UserIcon className="w-4 h-4 mr-1.5" />
                  Sign In
                </Button>
              </Link>
            )}

            {/* Mobile menu toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden hover:bg-white/5"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-white/5 animate-fade-in-up">
            <div className="flex flex-col gap-3">
              <Link
                href="/"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors px-2 py-1"
                onClick={() => setMobileMenuOpen(false)}
              >
                Home
              </Link>
              <Link
                href="/#products"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors px-2 py-1"
                onClick={() => setMobileMenuOpen(false)}
              >
                Products
              </Link>
              <Link
                href="/#categories"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors px-2 py-1"
                onClick={() => setMobileMenuOpen(false)}
              >
                Categories
              </Link>
              {user && (
                <Link
                  href="/my-orders"
                  className="text-sm text-blue-400 font-medium px-2 py-1 flex items-center gap-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <ShoppingBag className="w-4 h-4" />
                  My Keys & Orders
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
