import { useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { api, type User } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

export default function Login() {
  const [, navigate] = useLocation();
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<'dev' | 'register'>('dev');
  const [walletAddress, setWalletAddress] = useState('');
  const [role, setRole] = useState('DONOR');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  const handleDevLogin = async () => {
    if (!walletAddress.trim()) {
      toast.error('Masukkan wallet address');
      return;
    }

    setIsLoading(true);
    try {
      const res = await api.loginDev(walletAddress);
      if (res.success && res.data) {
        login(res.data.token, res.data.user);
        toast.success('Login berhasil!');
        navigate('/dashboard');
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Login gagal');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!walletAddress.trim() || !name.trim() || !role) {
      toast.error('Isi semua field yang diperlukan');
      return;
    }

    setIsLoading(true);
    try {
      const res = await api.registerUser({
        walletAddress,
        role,
        name,
        email: email || undefined,
        phone: phone || undefined,
      });

      if (res.success) {
        toast.success('Registrasi berhasil! Menunggu verifikasi admin.');
        // Clear form
        setWalletAddress('');
        setName('');
        setEmail('');
        setPhone('');
        setRole('DONOR');
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Registrasi gagal');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold text-blue-600">FoodChain</CardTitle>
          <CardDescription>Platform Donasi Makanan Blockchain</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Mode Selector */}
          <div className="flex gap-2">
            <Button
              variant={mode === 'dev' ? 'default' : 'outline'}
              className="flex-1"
              onClick={() => setMode('dev')}
            >
              Dev Login
            </Button>
            <Button
              variant={mode === 'register' ? 'default' : 'outline'}
              className="flex-1"
              onClick={() => setMode('register')}
            >
              Register
            </Button>
          </div>

          {mode === 'dev' ? (
            // Dev Login
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Wallet Address</label>
                <Input
                  placeholder="0x..."
                  value={walletAddress}
                  onChange={(e) => setWalletAddress(e.target.value)}
                  className="mt-1"
                />
              </div>
              <Button
                onClick={handleDevLogin}
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  'Login (Dev Mode)'
                )}
              </Button>
              <p className="text-xs text-gray-500 text-center">
                Mode development - tanpa signature wallet
              </p>
            </div>
          ) : (
            // Register
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Wallet Address</label>
                <Input
                  placeholder="0x..."
                  value={walletAddress}
                  onChange={(e) => setWalletAddress(e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Role</label>
                <Select value={role} onValueChange={setRole}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DONOR">Donor</SelectItem>
                    <SelectItem value="STORE">Toko</SelectItem>
                    <SelectItem value="RECIPIENT">Penerima</SelectItem>
                    <SelectItem value="COURIER">Kurir</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium">Nama *</label>
                <Input
                  placeholder="Nama lengkap"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Email</label>
                <Input
                  type="email"
                  placeholder="email@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Telepon</label>
                <Input
                  placeholder="+62..."
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="mt-1"
                />
              </div>

              <Button
                onClick={handleRegister}
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  'Daftar'
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
