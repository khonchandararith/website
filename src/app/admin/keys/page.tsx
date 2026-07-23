'use client';

import { useEffect, useState } from 'react';
import { Key, Upload, Package, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
import type { Product, LicenseKey } from '@/lib/types';
import { toast } from 'sonner';

interface ProductWithKeys extends Product {
  sold_count: number;
  available_count: number;
}

export default function AdminKeysPage() {
  const [products, setProducts] = useState<ProductWithKeys[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [keys, setKeys] = useState<LicenseKey[]>([]);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importProductId, setImportProductId] = useState('');
  const [keysText, setKeysText] = useState('');
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const supabase = createClient();

      const { data: prods } = await supabase
        .from('products')
        .select('*')
        .order('title');

      if (!prods) return;

      // Get counts for each product
      const enriched: ProductWithKeys[] = await Promise.all(
        prods.map(async (p) => {
          const { count: sold } = await supabase
            .from('license_keys')
            .select('*', { count: 'exact', head: true })
            .eq('product_id', p.id)
            .eq('is_sold', true);

          const { count: available } = await supabase
            .from('license_keys')
            .select('*', { count: 'exact', head: true })
            .eq('product_id', p.id)
            .eq('is_sold', false);

          return {
            ...p,
            sold_count: sold || 0,
            available_count: available || 0,
          } as ProductWithKeys;
        })
      );

      setProducts(enriched);
    } catch {
      // Supabase not configured
    }
  };

  const fetchKeys = async (productId: string) => {
    try {
      const supabase = createClient();
      const { data } = await supabase
        .from('license_keys')
        .select('*')
        .eq('product_id', productId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (data) setKeys(data);
    } catch {
      // Error fetching keys
    }
  };

  const handleViewKeys = (product: Product) => {
    setSelectedProduct(product);
    fetchKeys(product.id);
  };

  const handleImport = async () => {
    if (!importProductId || !keysText.trim()) {
      toast.error('Please select a product and enter keys');
      return;
    }

    const keyLines = keysText
      .split('\n')
      .map((k) => k.trim())
      .filter((k) => k.length > 0);

    if (keyLines.length === 0) {
      toast.error('No valid keys found');
      return;
    }

    setImporting(true);
    try {
      const supabase = createClient();

      const insertData = keyLines.map((key) => ({
        product_id: importProductId,
        key_code: key,
        is_sold: false,
      }));

      const { error } = await supabase.from('license_keys').insert(insertData);

      if (error) {
        toast.error('Failed to import keys');
      } else {
        toast.success(`Successfully imported ${keyLines.length} keys`);
        setImportDialogOpen(false);
        setKeysText('');
        fetchProducts();
        if (selectedProduct?.id === importProductId) {
          fetchKeys(importProductId);
        }
      }
    } catch {
      toast.error('Import failed');
    }
    setImporting(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">License Keys</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage your key inventory</p>
        </div>
        <Button
          onClick={() => setImportDialogOpen(true)}
          className="bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0"
        >
          <Upload className="w-4 h-4 mr-2" />
          Import Keys
        </Button>
      </div>

      {/* Stock Overview */}
      <Card className="glass-card border-white/5">
        <CardHeader>
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Package className="w-4 h-4 text-blue-400" />
            Stock Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-white/5">
                <TableHead className="text-xs">Product</TableHead>
                <TableHead className="text-xs text-center">Available</TableHead>
                <TableHead className="text-xs text-center">Sold</TableHead>
                <TableHead className="text-xs text-center">Total</TableHead>
                <TableHead className="text-xs text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product) => (
                <TableRow key={product.id} className="border-white/5">
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Key className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">{product.title}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge
                      variant="outline"
                      className={`text-[10px] ${
                        product.available_count > 0
                          ? 'border-green-500/20 text-green-400'
                          : 'border-red-500/20 text-red-400'
                      }`}
                    >
                      {product.available_count}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="outline" className="text-[10px] border-blue-500/20 text-blue-400">
                      {product.sold_count}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center text-xs text-muted-foreground">
                    {product.available_count + product.sold_count}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs hover:bg-white/5"
                      onClick={() => handleViewKeys(product)}
                    >
                      View Keys
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {products.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12 text-muted-foreground text-sm">
                    No products yet. Add products first, then import keys.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Keys for selected product */}
      {selectedProduct && (
        <Card className="glass-card border-white/5">
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Key className="w-4 h-4 text-purple-400" />
              Keys: {selectedProduct.title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="border-white/5">
                  <TableHead className="text-xs">Key Code</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                  <TableHead className="text-xs">Added</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {keys.map((key) => (
                  <TableRow key={key.id} className="border-white/5">
                    <TableCell className="text-xs font-mono">{key.key_code}</TableCell>
                    <TableCell>
                      {key.is_sold ? (
                        <Badge variant="outline" className="text-[10px] border-red-500/20 text-red-400">
                          <XCircle className="w-3 h-3 mr-1" />
                          Sold
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px] border-green-500/20 text-green-400">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Available
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(key.created_at).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
                {keys.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-8 text-muted-foreground text-sm">
                      No keys for this product. Import some keys above.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Import Dialog */}
      <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
        <DialogContent className="sm:max-w-lg bg-background/95 backdrop-blur-xl border-white/10">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5 text-blue-400" />
              Bulk Import License Keys
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-2">
            <div className="space-y-2">
              <label className="text-xs text-muted-foreground">Select Product *</label>
              <select
                value={importProductId}
                onChange={(e) => setImportProductId(e.target.value)}
                className="w-full h-9 rounded-md bg-white/5 border border-white/10 px-3 text-sm text-foreground"
              >
                <option value="">Choose a product</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs text-muted-foreground">
                License Keys (one per line) *
              </label>
              <textarea
                value={keysText}
                onChange={(e) => setKeysText(e.target.value)}
                placeholder="XXXXX-XXXXX-XXXXX-XXXXX-XXXXX&#10;YYYYY-YYYYY-YYYYY-YYYYY-YYYYY&#10;ZZZZZ-ZZZZZ-ZZZZZ-ZZZZZ-ZZZZZ"
                rows={8}
                className="w-full rounded-md bg-white/5 border border-white/10 px-3 py-2 text-sm font-mono text-foreground resize-none"
              />
              <p className="text-xs text-muted-foreground">
                {keysText.split('\n').filter((k) => k.trim()).length} keys detected
              </p>
            </div>

            <Button
              onClick={handleImport}
              disabled={importing}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0"
            >
              {importing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
              Import Keys
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
