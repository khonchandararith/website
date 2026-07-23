'use client';

import {
  Monitor,
  FileText,
  Shield,
  Palette,
  Gamepad2,
  Wrench,
  LayoutGrid,
} from 'lucide-react';
import type { Category } from '@/lib/types';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Monitor,
  FileText,
  Shield,
  Palette,
  Gamepad2,
  Wrench,
  Package: LayoutGrid,
  LayoutGrid,
};

interface CategoryFilterProps {
  categories: Category[];
  activeCategory: string | null;
  onCategoryChange: (slug: string | null) => void;
}

export function CategoryFilter({ categories, activeCategory, onCategoryChange }: CategoryFilterProps) {
  return (
    <section id="categories" className="py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3 overflow-x-auto pb-4 scrollbar-hide">
          {/* All button */}
          <button
            onClick={() => onCategoryChange(null)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all duration-300 ${
              activeCategory === null
                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/25'
                : 'glass-card hover:bg-white/5 text-muted-foreground'
            }`}
          >
            <LayoutGrid className="w-4 h-4" />
            All Products
          </button>

          {categories.map((category) => {
            const IconComponent = iconMap[category.icon] || LayoutGrid;
            const isActive = activeCategory === category.slug;

            return (
              <button
                key={category.id}
                onClick={() => onCategoryChange(isActive ? null : category.slug)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all duration-300 ${
                  isActive
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/25'
                    : 'glass-card hover:bg-white/5 text-muted-foreground'
                }`}
              >
                <IconComponent className="w-4 h-4" />
                {category.name}
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
