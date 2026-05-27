import { ethers } from 'ethers';

let provider = null;
let signer = null;

export const connectWallet = async () => {
  if (!window.ethereum) {
    throw new Error('MetaMask not installed! Please install MetaMask extension.');
  }

  try {
    provider = new ethers.BrowserProvider(window.ethereum);
    await provider.send('eth_requestAccounts', []);
    signer = await provider.getSigner();
    const address = await signer.getAddress();
    
    // Listen for account changes
    window.ethereum.on('accountsChanged', (accounts) => {
      if (accounts.length === 0) {
        disconnectWallet();
      } else {
        window.location.reload();
      }
    });

    return address;
  } catch (error) {
    console.error('Failed to connect wallet:', error);
    throw error;
  }
};

export const getSigner = () => signer;
export const getProvider = () => provider;

export const getWalletAddress = async () => {
  if (signer) {
    return await signer.getAddress();
  }
  return null;
};

export const signMessage = async (message) => {
  if (!signer) {
    throw new Error('Wallet not connected');
  }
  const signature = await signer.signMessage(message);
  return signature;
};

export const disconnectWallet = () => {
  provider = null;
  signer = null;
};

export const getNetwork = async () => {
  if (provider) {
    const network = await provider.getNetwork();
    return network;
  }
  return null;
};

export const switchToPolygon = async () => {
  try {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: '0x13881' }], // Mumbai testnet
    });
  } catch (error) {
    if (error.code === 4902) {
      await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [{
          chainId: '0x13881',
          chainName: 'Polygon Amoy Testnet',
          nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 },
          rpcUrls: ['https://rpc-amoy.polygon.technology'],
          blockExplorerUrls: ['https://amoy.polygonscan.com/'],
        }],
      });
    }
  }
};