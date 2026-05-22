import { useState } from 'react';
import { useLocation, useSearch } from 'wouter';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

export default function CreateDonation() {
  const [, navigate] = useLocation();
  const search = useSearch();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    storeAddress: '',
    recipientAddress: '',
    courierAddress: '',
    productIds: search ? [parseInt(new URLSearchParams(search).get('productId') || '0')] : [],
    amount: '',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (
      !formData.storeAddress.trim() ||
      !formData.recipientAddress.trim() ||
      !formData.courierAddress.trim() ||
      !formData.amount.trim()
    ) {
      toast.error('Isi semua field yang diperlukan');
      return;
    }

    setIsLoading(true);
    try {
      const res = await api.createDonation({
        storeAddress: formData.storeAddress,
        recipientAddress: formData.recipientAddress,
        courierAddress: formData.courierAddress,
        productIds: formData.productIds,
        amount: formData.amount,
      });

      if (res.success) {
        toast.success('Donasi berhasil dibuat!');
        navigate('/dashboard');
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Gagal membuat donasi');
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/dashboard')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-blue-600">Buat Donasi</h1>
            <p className="text-sm text-gray-500">Daftarkan donasi makanan baru</p>
          </div>
        </div>
      </header>

      {/* Form */}
      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Detail Donasi</CardTitle>
            <CardDescription>
              Isi semua informasi untuk membuat donasi baru
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="text-sm font-medium">Alamat Toko *</label>
                <Input
                  placeholder="0x..."
                  value={formData.storeAddress}
                  onChange={(e) =>
                    setFormData({ ...formData, storeAddress: e.target.value })
                  }
                  className="mt-1"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Wallet address toko yang menyediakan produk
                </p>
              </div>

              <div>
                <label className="text-sm font-medium">Alamat Penerima *</label>
                <Input
                  placeholder="0x..."
                  value={formData.recipientAddress}
                  onChange={(e) =>
                    setFormData({ ...formData, recipientAddress: e.target.value })
                  }
                  className="mt-1"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Wallet address penerima donasi
                </p>
              </div>

              <div>
                <label className="text-sm font-medium">Alamat Kurir *</label>
                <Input
                  placeholder="0x..."
                  value={formData.courierAddress}
                  onChange={(e) =>
                    setFormData({ ...formData, courierAddress: e.target.value })
                  }
                  className="mt-1"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Wallet address kurir yang akan mengantarkan
                </p>
              </div>

              <div>
                <label className="text-sm font-medium">Jumlah Donasi *</label>
                <Input
                  placeholder="Masukkan jumlah"
                  type="number"
                  value={formData.amount}
                  onChange={(e) =>
                    setFormData({ ...formData, amount: e.target.value })
                  }
                  className="mt-1"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Total nilai donasi dalam satuan terkecil
                </p>
              </div>

              <div>
                <label className="text-sm font-medium">ID Produk</label>
                <div className="mt-1 p-3 bg-gray-50 rounded border">
                  {formData.productIds.length > 0 ? (
                    <div className="space-y-2">
                      {formData.productIds.map((id, idx) => (
                        <div key={idx} className="flex items-center justify-between">
                          <span>Produk #{id}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setFormData({
                                ...formData,
                                productIds: formData.productIds.filter((_, i) => i !== idx),
                              });
                            }}
                          >
                            Hapus
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm">Belum ada produk dipilih</p>
                  )}
                </div>
              </div>

              <div className="flex gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/dashboard')}
                >
                  Batal
                </Button>
                <Button type="submit" disabled={isLoading} className="flex-1">
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    'Buat Donasi'
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
