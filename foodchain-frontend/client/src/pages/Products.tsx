import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { api, type Product } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Loader2, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

export default function Products() {
  const [, navigate] = useLocation();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [storeFilter, setStoreFilter] = useState('');

  useEffect(() => {
    loadProducts();
  }, [page, storeFilter]);

  const loadProducts = async () => {
    setIsLoading(true);
    try {
      const res = await api.getProducts(storeFilter || undefined, page, 12);
      if (res.success && res.data) {
        setProducts(res.data.products);
      }
    } catch (error) {
      toast.error('Gagal memuat produk');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/dashboard')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-blue-600">Produk Tersedia</h1>
            <p className="text-sm text-gray-500">Daftar produk untuk didonasikan</p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filter */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="flex gap-4">
              <Input
                placeholder="Filter by store address..."
                value={storeFilter}
                onChange={(e) => {
                  setStoreFilter(e.target.value);
                  setPage(1);
                }}
                className="flex-1"
              />
              <Button onClick={loadProducts}>Cari</Button>
            </div>
          </CardContent>
        </Card>

        {/* Products Grid */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : products.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-gray-500">
              Tidak ada produk tersedia
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {products.map((product) => (
                <Card key={product.id} className="flex flex-col">
                  <CardHeader>
                    <CardTitle className="text-lg">{product.name}</CardTitle>
                    <CardDescription>
                      Toko: {product.storeAddress.slice(0, 10)}...
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-500">Harga</p>
                        <p className="font-bold text-lg">{product.price}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Stock</p>
                        <p className="font-bold text-lg">{product.stock}</p>
                      </div>
                    </div>

                    <div>
                      <p className="text-sm text-gray-500">Kedaluwarsa</p>
                      <p className="font-medium">
                        {new Date(product.expiryDate).toLocaleDateString('id-ID')}
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <Badge variant={product.isAvailable ? 'default' : 'secondary'}>
                        {product.isAvailable ? 'Tersedia' : 'Tidak Tersedia'}
                      </Badge>
                    </div>

                    <Button
                      className="w-full mt-auto"
                      onClick={() => navigate(`/donations/create?productId=${product.onChainId}`)}
                      disabled={!product.isAvailable}
                    >
                      Donasi Produk Ini
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Pagination */}
            <div className="flex justify-center gap-4">
              <Button
                variant="outline"
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
              >
                Sebelumnya
              </Button>
              <span className="flex items-center px-4">Halaman {page}</span>
              <Button
                variant="outline"
                onClick={() => setPage(page + 1)}
                disabled={products.length < 12}
              >
                Berikutnya
              </Button>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
