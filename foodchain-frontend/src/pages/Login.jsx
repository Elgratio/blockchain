import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { signMessage, getWalletAddress } from '../services/wallet';
import { FiAlertCircle, FiCheckCircle } from 'react-icons/fi';

const Login = () => {
  const { loginWithWallet, loginDev, connectWallet, walletAddress, isAuthenticated } = useAuth();
  const [step, setStep] = useState(1);
  const [signature, setSignature] = useState(null);
  const [message] = useState(`Welcome to FoodChain!\n\nSign this message to authenticate.\nTimestamp: ${Date.now()}`);
  const [devAddress, setDevAddress] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  const handleConnectWallet = async () => {
    try {
      await connectWallet();
      setStep(2);
    } catch (error) {
      console.error(error);
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
    }
  };

  const handleDevLogin = async () => {
    if (!devAddress) {
      alert('Please enter a wallet address');
      return;
    }
    try {
      await loginDev(devAddress);
      navigate('/dashboard');
    } catch (error) {
      console.error(error);
    }
  };

  const wallets = [
    { address: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266', name: 'Admin' },
    { address: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8', name: 'Donor' },
    { address: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC', name: 'Store' },
    { address: '0x90F79bf6EB2c4f870365E785982E1f101E93b906', name: 'Recipient' },
    { address: '0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65', name: 'Courier' },
  ];

  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <FiCheckCircle className="text-white text-3xl" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800">Welcome to FoodChain</h1>
          <p className="text-gray-500 mt-2">Connect your wallet to start donating</p>
        </div>

        <div className="card">
          {process.env.NODE_ENV === 'development' && (
            <div className="mb-8">
              <h3 className="font-semibold text-gray-700 mb-3">Development Login</h3>
              <select
                value={devAddress}
                onChange={(e) => setDevAddress(e.target.value)}
                className="input mb-3"
              >
                <option value="">Select a wallet</option>
                {wallets.map((wallet) => (
                  <option key={wallet.address} value={wallet.address}>
                    {wallet.name} - {wallet.address.slice(0, 10)}...
                  </option>
                ))}
              </select>
              <button onClick={handleDevLogin} className="btn-secondary w-full">
                Login as User
              </button>
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">Or</span>
                </div>
              </div>
            </div>
          )}

          {step === 1 && (
            <div>
              <button onClick={handleConnectWallet} className="btn-primary w-full">
                Connect MetaMask Wallet
              </button>
            </div>
          )}

          {step === 2 && walletAddress && (
            <div>
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <p className="text-sm text-gray-600 mb-2">Connected Wallet:</p>
                <p className="font-mono text-sm">{walletAddress}</p>
              </div>
              <div className="bg-yellow-50 rounded-lg p-4 mb-4">
                <div className="flex items-start space-x-2">
                  <FiAlertCircle className="text-yellow-600 mt-0.5" />
                  <div>
                    <p className="text-sm text-yellow-800">
                      Please sign the message below to authenticate
                    </p>
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
      </div>
    </div>
  );
};

export default Login;