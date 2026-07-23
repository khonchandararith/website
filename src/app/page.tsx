'use client';

import { useState, useEffect, useMemo } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { HeroSection } from '@/components/home/HeroSection';
import { TrustBadges } from '@/components/home/TrustBadges';
import { CategoryFilter } from '@/components/home/CategoryFilter';
import { ProductGrid } from '@/components/home/ProductGrid';
import { createClient } from '@/lib/supabase/client';
import type { Category, Product } from '@/lib/types';

// Demo data for when Supabase is not configured
const DEMO_CATEGORIES: Category[] = [
  { id: '1', name: 'Windows', slug: 'windows', icon: 'Monitor', created_at: '' },
  { id: '2', name: 'Microsoft Office', slug: 'office', icon: 'FileText', created_at: '' },
  { id: '3', name: 'Antivirus', slug: 'antivirus', icon: 'Shield', created_at: '' },
  { id: '4', name: 'Adobe', slug: 'adobe', icon: 'Palette', created_at: '' },
  { id: '5', name: 'Games', slug: 'games', icon: 'Gamepad2', created_at: '' },
  { id: '6', name: 'Utilities', slug: 'utilities', icon: 'Wrench', created_at: '' },
];

const DEMO_PRODUCTS: Product[] = [
  {
    id: 'p1', title: 'Windows 11 Pro', slug: 'windows-11-pro',
    description: 'Genuine Windows 11 Professional license key. Lifetime activation with all features unlocked.',
    price_usd: 15.99, price_khr: 65000, category_id: '1', image_url: null,
    is_active: true, created_at: '', stock_count: 25,
  },
  {
    id: 'p2', title: 'Windows 10 Pro', slug: 'windows-10-pro',
    description: 'Genuine Windows 10 Professional key. Supports upgrade to Windows 11.',
    price_usd: 12.99, price_khr: 53000, category_id: '1', image_url: null,
    is_active: true, created_at: '', stock_count: 30,
  },
  {
    id: 'p3', title: 'Microsoft Office 2024 Pro Plus', slug: 'office-2024-pro-plus',
    description: 'Full Office suite: Word, Excel, PowerPoint, Outlook, Access, Publisher. Lifetime license.',
    price_usd: 29.99, price_khr: 122000, category_id: '2', image_url: null,
    is_active: true, created_at: '', stock_count: 15,
  },
  {
    id: 'p4', title: 'Microsoft Office 2021 Pro Plus', slug: 'office-2021-pro-plus',
    description: 'Complete Office 2021 suite with lifetime activation. One-time purchase.',
    price_usd: 24.99, price_khr: 102000, category_id: '2', image_url: null,
    is_active: true, created_at: '', stock_count: 20,
  },
  {
    id: 'p5', title: 'Norton 360 Deluxe (1 Year)', slug: 'norton-360-deluxe',
    description: 'Complete antivirus protection for up to 5 devices. VPN, dark web monitoring included.',
    price_usd: 19.99, price_khr: 82000, category_id: '3', image_url: null,
    is_active: true, created_at: '', stock_count: 10,
  },
  {
    id: 'p6', title: 'Kaspersky Total Security (1 Year)', slug: 'kaspersky-total-security',
    description: 'Premium antivirus with parental controls, VPN, and password manager.',
    price_usd: 17.99, price_khr: 73000, category_id: '3', image_url: null,
    is_active: true, created_at: '', stock_count: 12,
  },
  {
    id: 'p7', title: 'Adobe Creative Cloud (1 Year)', slug: 'adobe-creative-cloud',
    description: 'Full access to all Adobe apps: Photoshop, Illustrator, Premiere Pro, After Effects & more.',
    price_usd: 49.99, price_khr: 204000, category_id: '4', image_url: null,
    is_active: true, created_at: '', stock_count: 8,
  },
  {
    id: 'p8', title: 'Adobe Photoshop 2024', slug: 'adobe-photoshop-2024',
    description: 'Industry-standard photo editing software. Perpetual license key.',
    price_usd: 34.99, price_khr: 143000, category_id: '4', image_url: null,
    is_active: true, created_at: '', stock_count: 10,
  },
  {
    id: 'p9', title: 'Minecraft Java Edition', slug: 'minecraft-java',
    description: 'Premium Minecraft Java Edition key. Play on PC with mods and multiplayer.',
    price_usd: 9.99, price_khr: 41000, category_id: '5', image_url: null,
    is_active: true, created_at: '', stock_count: 50,
  },
  {
    id: 'p10', title: 'WinRAR Lifetime License', slug: 'winrar-lifetime',
    description: 'Official WinRAR license key. Compress and extract files with ease.',
    price_usd: 5.99, price_khr: 24000, category_id: '6', image_url: null,
    is_active: true, created_at: '', stock_count: 100,
  },
  {
    id: 'p11', title: 'IDM Lifetime License', slug: 'idm-lifetime',
    description: 'Internet Download Manager lifetime key. Speed up downloads by 5x.',
    price_usd: 7.99, price_khr: 33000, category_id: '6', image_url: null,
    is_active: true, created_at: '', stock_count: 40,
  },
  {
    id: 'p12', title: 'Windows Server 2022 Standard', slug: 'windows-server-2022',
    description: 'Windows Server 2022 Standard Edition key for enterprise environments.',
    price_usd: 39.99, price_khr: 163000, category_id: '1', image_url: null,
    is_active: true, created_at: '', stock_count: 5,
  },
];

export default function HomePage() {
  const [categories, setCategories] = useState<Category[]>(DEMO_CATEGORIES);
  const [products, setProducts] = useState<Product[]>(DEMO_PRODUCTS);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loaded, setLoaded] = useState(false);

  // Try to fetch from Supabase
  useEffect(() => {
    const fetchData = async () => {
      try {
        const supabase = createClient();

        const res = await fetch('/api/products');
        if (res.ok) {
          const data = await res.json();
          if (data.categories) setCategories(data.categories);
          if (data.products) setProducts(data.products);
        }
      } catch {
        // Use fallback if any
      }
      setLoaded(true);
    };

    fetchData();
  }, []);

  // Filter products
  const filteredProducts = useMemo(() => {
    let result = products;

    if (activeCategory) {
      const cat = categories.find((c) => c.slug === activeCategory);
      if (cat) {
        result = result.filter((p) => p.category_id === cat.id);
      }
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          (p.description && p.description.toLowerCase().includes(q))
      );
    }

    return result;
  }, [products, activeCategory, searchQuery, categories]);

  return (
    <>
      <Navbar />
      <main className="flex-1">
        <HeroSection />
        <TrustBadges />
        <CategoryFilter
          categories={categories}
          activeCategory={activeCategory}
          onCategoryChange={setActiveCategory}
        />
        <ProductGrid
          products={filteredProducts}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />
      </main>
      <Footer />
    </>
  );
}
