'use client';

import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Package, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { createClient } from '@/lib/supabase/client';
import type { Product, Category } from '@/lib/types';
import { toast } from 'sonner';
import { formatImageUrl } from '@/lib/utils';

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [priceUsd, setPriceUsd] = useState('');
  const [priceKhr, setPriceKhr] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await fetch('/api/admin/products');
      if (res.ok) {
        const data = await res.json();
        setProducts(data as Product[]);
      }

      const supabase = createClient();
      const { data: cats } = await supabase
        .from('categories')
        .select('*')
        .order('name');
      if (cats) setCategories(cats);
    } catch {
      // Error fetching
    }
  };

  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  const handleTitleChange = (value: string) => {
    setTitle(value);
    if (!editingProduct) {
      setSlug(generateSlug(value));
    }
  };

  const openAddDialog = () => {
    setEditingProduct(null);
    setTitle('');
    setSlug('');
    setDescription('');
    setPriceUsd('');
    setPriceKhr('');
    setCategoryId('');
    setImageUrl('');
    setDialogOpen(true);
  };

  const openEditDialog = (product: Product) => {
    setEditingProduct(product);
    setTitle(product.title);
    setSlug(product.slug);
    setDescription(product.description || '');
    setPriceUsd(product.price_usd.toString());
    setPriceKhr(product.price_khr.toString());
    setCategoryId(product.category_id || '');
    setImageUrl(product.image_url || '');
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!title || !slug || !priceUsd) {
      toast.error('Please fill in required fields');
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();
      const data = {
        title,
        slug,
        description: description || null,
        price_usd: parseFloat(priceUsd),
        price_khr: parseInt(priceKhr) || 0,
        category_id: categoryId || null,
        image_url: imageUrl || null,
        is_active: true,
      };

      if (editingProduct) {
        await supabase.from('products').update(data).eq('id', editingProduct.id);
        toast.success('Product updated');
      } else {
        await supabase.from('products').insert(data);
        toast.success('Product created');
      }

      setDialogOpen(false);
      fetchData();
    } catch {
      toast.error('Failed to save product');
    }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this product? This will also remove all associated license keys.')) return;

    try {
      const supabase = createClient();
      await supabase.from('products').delete().eq('id', id);
      toast.success('Product deleted');
      fetchData();
    } catch {
      toast.error('Failed to delete product');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Products</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage your product catalog</p>
        </div>
        <Button
          onClick={openAddDialog}
          className="bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Product
        </Button>
      </div>

      <Card className="glass-card border-white/5">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-white/5">
                <TableHead className="text-xs">Product</TableHead>
                <TableHead className="text-xs">Category</TableHead>
                <TableHead className="text-xs">Price</TableHead>
                <TableHead className="text-xs">Stock</TableHead>
                <TableHead className="text-xs">Status</TableHead>
                <TableHead className="text-xs text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product) => (
                <TableRow key={product.id} className="border-white/5">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center overflow-hidden shrink-0 border border-white/10">
                        {formatImageUrl(product.image_url) ? (
                          <img
                            src={formatImageUrl(product.image_url)!}
                            alt={product.title}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Package className="w-4 h-4 text-muted-foreground" />
                        )}
                      </div>
                      <div>
                        <div className="text-sm font-medium">{product.title}</div>
                        <div className="text-[10px] text-muted-foreground font-mono">{product.slug}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {product.category?.name || '—'}
                  </TableCell>
                  <TableCell className="text-xs font-medium">
                    ${product.price_usd.toFixed(2)}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={`text-[10px] ${
                        (product.stock_count || 0) > 0
                          ? 'border-green-500/20 text-green-400'
                          : 'border-red-500/20 text-red-400'
                      }`}
                    >
                      {product.stock_count || 0} keys
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={`text-[10px] ${
                        product.is_active
                          ? 'border-green-500/20 text-green-400'
                          : 'border-gray-500/20 text-gray-400'
                      }`}
                    >
                      {product.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 hover:bg-white/5"
                        onClick={() => openEditDialog(product)}
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 hover:bg-red-500/10 text-destructive"
                        onClick={() => handleDelete(product.id)}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {products.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-muted-foreground text-sm">
                    No products yet. Click "Add Product" to get started.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg bg-background/95 backdrop-blur-xl border-white/10">
          <DialogHeader>
            <DialogTitle>
              {editingProduct ? 'Edit Product' : 'Add New Product'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-2">
                <label className="text-xs text-muted-foreground">Title *</label>
                <Input
                  value={title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder="e.g. Windows 11 Pro"
                  className="bg-white/5 border-white/10"
                />
              </div>
              <div className="col-span-2 space-y-2">
                <label className="text-xs text-muted-foreground">Slug *</label>
                <Input
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="windows-11-pro"
                  className="bg-white/5 border-white/10 font-mono text-xs"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs text-muted-foreground">Price (USD) *</label>
                <Input
                  type="number"
                  step="0.01"
                  value={priceUsd}
                  onChange={(e) => setPriceUsd(e.target.value)}
                  placeholder="15.99"
                  className="bg-white/5 border-white/10"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs text-muted-foreground">Price (KHR)</label>
                <Input
                  type="number"
                  value={priceKhr}
                  onChange={(e) => setPriceKhr(e.target.value)}
                  placeholder="65000"
                  className="bg-white/5 border-white/10"
                />
              </div>
              <div className="col-span-2 space-y-2">
                <label className="text-xs text-muted-foreground">Category</label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full h-9 rounded-md bg-white/5 border border-white/10 px-3 text-sm text-foreground"
                >
                  <option value="">No category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-span-2 space-y-2">
                <label className="text-xs text-muted-foreground">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Product description..."
                  rows={3}
                  className="w-full rounded-md bg-white/5 border border-white/10 px-3 py-2 text-sm text-foreground resize-none"
                />
              </div>
              <div className="col-span-2 space-y-2">
                <label className="text-xs text-muted-foreground">Image URL</label>
                <Input
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://..."
                  className="bg-white/5 border-white/10"
                />
              </div>
            </div>

            <Button
              onClick={handleSave}
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : null}
              {editingProduct ? 'Update Product' : 'Create Product'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
