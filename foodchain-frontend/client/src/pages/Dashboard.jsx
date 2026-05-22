import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Loader2, LogOut, Plus } from 'lucide-react';
import { toast } from 'sonner';

export default function Dashboard() {
  const [, navigate] = useLocation();
  const { user, logout, isLoading: authLoading } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [donations, setDonations] = useState([]);
  const [products, setProducts] = useState([]);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    loadData();
  }, [user, navigate]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      // Load donations
      const donRes = await api.getDonations();
      if (donRes.success && donRes.data) {
        setDonations(donRes.data.donations);
      }

      // Load products if store
      if (user?.role === 'STORE') {
        const prodRes = await api.getMyProducts();
        if (prodRes.success && prodRes.data) {
          setProducts(prodRes.data.products);
        }
      }
    } catch (error) {
      toast.error('Gagal memuat data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const getRoleBadgeColor = (role) => {
    const colors = {
      DONOR: 'bg-blue-100 text-blue-800',
      STORE: 'bg-green-100 text-green-800',
      RECIPIENT: 'bg-purple-100 text-purple-800',
      COURIER: 'bg-orange-100 text-orange-800',
      ADMIN: 'bg-red-100 text-red-800',
    };
    return colors[role] || 'bg-gray-100 text-gray-800';
  };

  const getStatusBadgeColor = (status) => {
    const colors = {
      CREATED: 'bg-yellow-100 text-yellow-800',
      STORE_CONFIRMED: 'bg-blue-100 text-blue-800',
      IN_DELIVERY: 'bg-purple-100 text-purple-800',
      DELIVERED: 'bg-green-100 text-green-800',
      COMPLETED: 'bg-green-100 text-green-800',
      DISPUTED: 'bg-red-100 text-red-800',
      REFUNDED: 'bg-gray-100 text-gray-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-blue-600">FoodChain</h1>
            <p className="text-sm text-gray-500">Dashboard</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="font-medium">{user.name}</p>
              <Badge className={getRoleBadgeColor(user.role)}>{user.role}</Badge>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* User Info Card */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Profil Saya</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Nama</p>
                <p className="font-medium">{user.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Wallet Address</p>
                <p className="font-mono text-sm break-all">{user.walletAddress}</p>
              </div>
              {user.email && (
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="font-medium">{user.email}</p>
                </div>
              )}
              {user.phone && (
                <div>
                  <p className="text-sm text-gray-500">Telepon</p>
                  <p className="font-medium">{user.phone}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-gray-500">Status Verifikasi</p>
                <Badge variant={user.isVerified ? 'default' : 'secondary'}>
                  {user.isVerified ? 'Terverifikasi' : 'Menunggu Verifikasi'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Role-Specific Content */}
        <Tabs defaultValue="donations" className="space-y-4">
          <TabsList>
            {user.role === 'STORE' && (
              <>
                <TabsTrigger value="products">Produk Saya</TabsTrigger>
                <TabsTrigger value="donations">Donasi</TabsTrigger>
              </>
            )}
            {user.role === 'DONOR' && (
              <>
                <TabsTrigger value="donations">Donasi Saya</TabsTrigger>
              </>
            )}
            {user.role === 'RECIPIENT' && (
              <>
                <TabsTrigger value="donations">Donasi Diterima</TabsTrigger>
              </>
            )}
            {user.role === 'COURIER' && (
              <>
                <TabsTrigger value="donations">Pengiriman</TabsTrigger>
              </>
            )}
          </TabsList>

          {/* Products Tab */}
          {user.role === 'STORE' && (
            <TabsContent value="products" className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold">Produk Saya</h2>
                <Button onClick={() => navigate('/products/create')}>
                  <Plus className="h-4 w-4 mr-2" />
                  Tambah Produk
                </Button>
              </div>

              {isLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : products.length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center text-gray-500">
                    Belum ada produk. Tambahkan produk baru untuk mulai berdonasi.
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {products.map((product) => (
                    <Card key={product.id}>
                      <CardHeader>
                        <CardTitle className="text-lg">{product.name}</CardTitle>
                        <CardDescription>Stock: {product.stock}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div>
                            <p className="text-sm text-gray-500">Harga</p>
                            <p className="font-medium">{product.price}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Kedaluwarsa</p>
                            <p className="font-medium">
                              {new Date(product.expiryDate).toLocaleDateString('id-ID')}
                            </p>
                          </div>
                          <Badge variant={product.isAvailable ? 'default' : 'secondary'}>
                            {product.isAvailable ? 'Tersedia' : 'Tidak Tersedia'}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          )}

          {/* Donations Tab */}
          <TabsContent value="donations" className="space-y-4">
            <h2 className="text-xl font-bold">
              {user.role === 'DONOR'
                ? 'Donasi Saya'
                : user.role === 'STORE'
                  ? 'Donasi ke Toko Saya'
                  : user.role === 'RECIPIENT'
                    ? 'Donasi yang Saya Terima'
                    : 'Pengiriman Saya'}
            </h2>

            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : donations.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-gray-500">
                  Belum ada donasi
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {donations.map((donation) => (
                  <Card key={donation.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg">Donasi #{donation.onChainId}</CardTitle>
                          <CardDescription>
                            {new Date(donation.createdAt).toLocaleDateString('id-ID')}
                          </CardDescription>
                        </div>
                        <Badge className={getStatusBadgeColor(donation.status)}>
                          {donation.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-500">Jumlah</p>
                          <p className="font-medium">{donation.amount}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Produk</p>
                          <p className="font-medium">{donation.productIds.length} item</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Donor</p>
                          <p className="font-mono text-sm break-all">
                            {donation.donorAddress.slice(0, 10)}...
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Penerima</p>
                          <p className="font-mono text-sm break-all">
                            {donation.recipientAddress.slice(0, 10)}...
                          </p>
                        </div>
                      </div>
                      {donation.recipientRating > 0 && (
                        <div className="mt-4">
                          <p className="text-sm text-gray-500">Rating</p>
                          <p className="font-medium">⭐ {donation.recipientRating}/5</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
