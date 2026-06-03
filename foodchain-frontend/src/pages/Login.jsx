import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  signMessage, 
  getWalletAddress, 
  switchToHardhatNetwork, 
  connectWallet,
  getBalance,
  HARDHAT_ACCOUNTS 
} from '../services/wallet';
import { 
  FiAlertCircle, 
  FiCheckCircle, 
  FiInfo, 
  FiUserPlus, 
  FiLogIn, 
  FiCopy,
  FiCpu
} from 'react-icons/fi';
import toast from 'react-hot-toast';

const Login = () => {
  const { loginWithWallet, loginDev, isAuthenticated, registerUser } = useAuth();
  const [step, setStep] = useState(1);
  const [signature, setSignature] = useState(null);
  const [message] = useState(`Welcome to FoodChain!\n\nSign this message to authenticate.\nTimestamp: ${Date.now()}`);
  const [devAddress, setDevAddress] = useState('');
  const [showHardhatInfo, setShowHardhatInfo] = useState(true);
  const [activeTab, setActiveTab] = useState('login');
  const [connectedWallet, setConnectedWallet] = useState(null);
  const [walletBalance, setWalletBalance] = useState(null);
  const [registrationData, setRegistrationData] = useState({
    walletAddress: '',
    role: '',
    name: '',
    email: '',
    phone: ''
  });
  const [registering, setRegistering] = useState(false);
  const [checkingWallet, setCheckingWallet] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
    checkWalletConnection();
  }, [isAuthenticated, navigate]);

  const checkWalletConnection = async () => {
    const address = await getWalletAddress();
    if (address) {
      setConnectedWallet(address);
      setRegistrationData(prev => ({ ...prev, walletAddress: address }));
      const balance = await getBalance();
      setWalletBalance(balance);
    }
  };

  const handleConnectMetaMask = async () => {
    try {
      setCheckingWallet(true);
      await switchToHardhatNetwork();
      const address = await connectWallet();
      setConnectedWallet(address);
      setRegistrationData(prev => ({ ...prev, walletAddress: address }));
      const balance = await getBalance();
      setWalletBalance(balance);
      toast.success(`Wallet connected: ${address.slice(0, 6)}...${address.slice(-4)}`);
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      toast.error(error.message || 'Failed to connect wallet');
    } finally {
      setCheckingWallet(false);
    }
  };

  const handleSignMessage = async () => {
    try {
      const sig = await signMessage(message);
      setSignature(sig);
      await loginWithWallet(sig, message);
      navigate('/dashboard');
    } catch (error) {
      console.error(error);
      toast.error('Failed to sign message');
    }
  };

  const handleDevLogin = async () => {
    if (!devAddress) {
      toast.error('Please select a wallet address');
      return;
    }
    try {
      await loginDev(devAddress);
      navigate('/dashboard');
    } catch (error) {
      console.error(error);
      toast.error('Login failed');
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    
    console.log('=== REGISTRATION STARTED ===');
    console.log('Connected wallet:', connectedWallet);
    console.log('Registration data:', registrationData);
    
    if (!connectedWallet) {
      toast.error('Please connect your MetaMask wallet first');
      return;
    }
    
    if (!registrationData.role) {
      toast.error('Please select a role');
      return;
    }
    
    if (!registrationData.name) {
      toast.error('Please enter your name');
      return;
    }
    
    setRegistering(true);
    try {
      const registerPayload = {
        walletAddress: connectedWallet,
        role: registrationData.role,
        name: registrationData.name,
        email: registrationData.email || '',
        phone: registrationData.phone || ''
      };
      
      console.log('Sending payload:', registerPayload);
      
      const response = await registerUser(registerPayload);
      console.log('Response:', response);
      
      if (response && response.success) {
        toast.success('Registration successful! Please wait for admin verification.');
        // Reset form
        setRegistrationData({
          walletAddress: connectedWallet,
          role: '',
          name: '',
          email: '',
          phone: ''
        });
        // Switch to login tab after delay
        setTimeout(() => {
          setActiveTab('login');
          toast.success('You can now login after admin verification');
        }, 2000);
      }
    } catch (error) {
      console.error('Registration error:', error);
      // Error already handled in AuthContext
    } finally {
      setRegistering(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Address copied to clipboard');
  };

  const wallets = [
    { address: HARDHAT_ACCOUNTS.ADMIN.address, name: 'Admin', role: 'ADMIN' },
    { address: HARDHAT_ACCOUNTS.DONOR.address, name: 'Donor', role: 'DONOR' },
    { address: HARDHAT_ACCOUNTS.STORE.address, name: 'Store', role: 'STORE' },
    { address: HARDHAT_ACCOUNTS.RECIPIENT.address, name: 'Recipient', role: 'RECIPIENT' },
    { address: HARDHAT_ACCOUNTS.COURIER.address, name: 'Courier', role: 'COURIER' },
  ];

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-8">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <FiCheckCircle className="text-white text-3xl" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800">FoodChain</h1>
          <p className="text-gray-500 mt-2">Blockchain Food Donation Platform</p>
        </div>

        {/* Hardhat Network Info */}
        {showHardhatInfo && (
          <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start space-x-2">
              <FiInfo className="text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-blue-800">Hardhat Local Network</p>
                <p className="text-xs text-blue-600 mt-1">
                  Make sure Hardhat node is running: <code className="bg-blue-100 px-1 rounded">npx hardhat node</code>
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  Each account has 10,000 MATIC for testing
                </p>
                <button 
                  onClick={switchToHardhatNetwork}
                  className="mt-2 text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700"
                >
                  Switch to Hardhat Network
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex mb-6 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('login')}
            className={`flex-1 py-2 font-medium transition-colors ${
              activeTab === 'login'
                ? 'text-primary-600 border-b-2 border-primary-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <FiLogIn className="inline mr-2" />
            Login
          </button>
          <button
            onClick={() => setActiveTab('register')}
            className={`flex-1 py-2 font-medium transition-colors ${
              activeTab === 'register'
                ? 'text-primary-600 border-b-2 border-primary-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <FiUserPlus className="inline mr-2" />
            Register
          </button>
        </div>

        {/* Registration Form with MetaMask */}
        {activeTab === 'register' && (
          <div className="card">
            <h3 className="font-semibold text-gray-800 mb-4">Register New Account</h3>
            
            {/* MetaMask Wallet Connection */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-700">MetaMask Wallet</label>
                {!connectedWallet ? (
                  <button
                    onClick={handleConnectMetaMask}
                    disabled={checkingWallet}
                    className="flex items-center space-x-1 text-primary-600 hover:text-primary-700 text-sm"
                  >
                    <FiCpu />
                    <span>{checkingWallet ? 'Connecting...' : 'Connect Wallet'}</span>
                  </button>
                ) : (
                  <span className="text-xs text-green-600 flex items-center">
                    <FiCheckCircle className="mr-1" /> Connected
                  </span>
                )}
              </div>
              
              {connectedWallet ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-green-600">Connected Wallet</p>
                      <p className="font-mono text-sm text-green-800">{connectedWallet.slice(0, 10)}...{connectedWallet.slice(-8)}</p>
                      {walletBalance && (
                        <p className="text-xs text-green-600 mt-1">Balance: {parseFloat(walletBalance).toFixed(4)} MATIC</p>
                      )}
                    </div>
                    <button
                      onClick={() => copyToClipboard(connectedWallet)}
                      className="text-green-600 hover:text-green-700"
                    >
                      <FiCopy />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-center">
                  <p className="text-sm text-yellow-700">Please connect your MetaMask wallet to register</p>
                  <p className="text-xs text-yellow-600 mt-1">Make sure you're on Hardhat Local Network</p>
                </div>
              )}
            </div>

            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="label">Role *</label>
                <select
                  className="input"
                  value={registrationData.role}
                  onChange={(e) => setRegistrationData({ ...registrationData, role: e.target.value })}
                  required
                >
                  <option value="">Select your role...</option>
                  <option value="DONOR">Donor - Donate food to those in need</option>
                  <option value="STORE">Store - List food products for donation</option>
                  <option value="RECIPIENT">Recipient - Receive food donations</option>
                  <option value="COURIER">Courier - Deliver food donations</option>
                </select>
              </div>

              <div>
                <label className="label">Full Name *</label>
                <input
                  type="text"
                  className="input"
                  value={registrationData.name}
                  onChange={(e) => setRegistrationData({ ...registrationData, name: e.target.value })}
                  placeholder="e.g., John Doe"
                  required
                />
              </div>

              <div>
                <label className="label">Email (Optional)</label>
                <input
                  type="email"
                  className="input"
                  value={registrationData.email}
                  onChange={(e) => setRegistrationData({ ...registrationData, email: e.target.value })}
                  placeholder="email@example.com"
                />
              </div>

              <div>
                <label className="label">Phone (Optional)</label>
                <input
                  type="tel"
                  className="input"
                  value={registrationData.phone}
                  onChange={(e) => setRegistrationData({ ...registrationData, phone: e.target.value })}
                  placeholder="+62 812 3456 7890"
                />
              </div>

              {connectedWallet && (
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500 mb-1">Wallet Address (auto-detected)</p>
                  <p className="font-mono text-xs text-gray-700 break-all">{connectedWallet}</p>
                </div>
              )}

              <button 
                type="submit" 
                disabled={registering || !connectedWallet} 
                className="btn-primary w-full"
              >
                {registering ? 'Registering...' : 'Register with MetaMask'}
              </button>
            </form>

            {!connectedWallet && (
              <div className="mt-4 text-center text-xs text-orange-600">
                <p>⚠️ Please connect your MetaMask wallet first to enable registration</p>
              </div>
            )}

            <div className="mt-4 text-center text-xs text-gray-500">
              <p>After registration, please wait for admin verification before logging in.</p>
            </div>
          </div>
        )}

        {/* Login Form */}
        {activeTab === 'login' && (
          <div className="card">
            {/* MetaMask Login Option */}
            <div className="mb-6">
              <h3 className="font-semibold text-gray-700 mb-3">Login with MetaMask</h3>
              {step === 1 && (
                <button onClick={handleConnectMetaMask} className="btn-primary w-full flex items-center justify-center space-x-2">
                  <FiCpu />
                  <span>Connect MetaMask</span>
                </button>
              )}
              {step === 2 && connectedWallet && (
                <div>
                  <div className="bg-gray-50 rounded-lg p-4 mb-4">
                    <p className="text-sm text-gray-600 mb-2">Connected Wallet:</p>
                    <p className="font-mono text-sm break-all">{connectedWallet}</p>
                    {walletBalance && (
                      <p className="text-xs text-green-600 mt-2">Balance: {parseFloat(walletBalance).toFixed(4)} MATIC</p>
                    )}
                  </div>
                  <div className="bg-yellow-50 rounded-lg p-4 mb-4">
                    <div className="flex items-start space-x-2">
                      <FiAlertCircle className="text-yellow-600 mt-0.5" />
                      <div>
                        <p className="text-sm text-yellow-800">Please sign the message to authenticate</p>
                        <p className="text-xs text-yellow-600 mt-1 break-all">{message}</p>
                      </div>
                    </div>
                  </div>
                  <button onClick={handleSignMessage} className="btn-primary w-full">
                    Sign Message & Login
                  </button>
                </div>
              )}
            </div>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Or Development Mode</span>
              </div>
            </div>

            {/* Development Login */}
            <div>
              <h3 className="font-semibold text-gray-700 mb-3">Development Login (No MetaMask)</h3>
              <select
                value={devAddress}
                onChange={(e) => setDevAddress(e.target.value)}
                className="input mb-3"
              >
                <option value="">Select a test wallet...</option>
                {wallets.map((wallet) => (
                  <option key={wallet.address} value={wallet.address}>
                    {wallet.name} ({wallet.role}) - 10,000 MATIC
                  </option>
                ))}
              </select>
              <button onClick={handleDevLogin} className="btn-secondary w-full">
                Login as User
              </button>
            </div>
          </div>
        )}

        <div className="mt-4 text-center text-xs text-gray-500">
          <p>Network: Hardhat Local (Chain ID: 31337) | Backend Port: 3001</p>
          <p className="mt-1">Make sure to run: <code className="bg-gray-100 px-1 rounded">npx hardhat node</code></p>
        </div>
      </div>
    </div>
  );
};

export default Login;