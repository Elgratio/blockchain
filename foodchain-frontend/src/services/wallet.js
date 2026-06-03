import { ethers } from 'ethers';

let provider = null;
let signer = null;

// Polygon/Hardhat configuration
const NETWORK_CONFIG = {
  chainId: 31337,  // Hardhat chain ID (mirip Polygon untuk testing)
  chainIdHex: '0x7A69',  // 31337 in hex
  name: 'Hardhat Local (Polygon-like)',
  rpcUrl: 'http://127.0.0.1:8545',
  currency: 'MATIC',
  currencySymbol: 'MATIC',
  blockExplorer: 'https://mumbai.polygonscan.com/'
};

// Hardhat test accounts (for development login without MetaMask)
export const HARDHAT_ACCOUNTS = {
  ADMIN: {
    address: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
    privateKey: '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
  },
  DONOR: {
    address: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
    privateKey: '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d',
  },
  STORE: {
    address: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',
    privateKey: '0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a',
  },
  RECIPIENT: {
    address: '0x90F79bf6EB2c4f870365E785982E1f101E93b906',
    privateKey: '0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6',
  },
  COURIER: {
    address: '0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65',
    privateKey: '0x47e179ec197488593b187f80a00eb0da91f1b9d0b13f8733639f19c30a34926a',
  },
};

// Connect wallet - langsung ke Hardhat via MetaMask
export const connectWallet = async () => {
  if (!window.ethereum) {
    throw new Error('MetaMask not installed! Please install MetaMask extension.');
  }

  try {
    // Request to switch to Hardhat network (configured as Polygon-like)
    await switchToHardhatNetwork();
    
    // Create provider and get signer
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

    // Listen for chain changes
    window.ethereum.on('chainChanged', () => {
      window.location.reload();
    });

    return address;
  } catch (error) {
    console.error('Failed to connect wallet:', error);
    throw error;
  }
};

// Switch to Hardhat network (configured as Polygon-like)
export const switchToHardhatNetwork = async () => {
  try {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: NETWORK_CONFIG.chainIdHex }],
    });
  } catch (error) {
    // If network doesn't exist, add it
    if (error.code === 4902) {
      await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [{
          chainId: NETWORK_CONFIG.chainIdHex,
          chainName: NETWORK_CONFIG.name,
          nativeCurrency: {
            name: NETWORK_CONFIG.currency,
            symbol: NETWORK_CONFIG.currencySymbol,
            decimals: 18,
          },
          rpcUrls: [NETWORK_CONFIG.rpcUrl],
          blockExplorerUrls: [NETWORK_CONFIG.blockExplorer],
        }],
      });
    } else {
      throw error;
    }
  }
};

// Switch to Polygon (for production)
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

// Get provider (for reading blockchain)
export const getProvider = () => {
  if (!provider) {
    // Create a read-only provider if no wallet connected
    provider = new ethers.JsonRpcProvider(NETWORK_CONFIG.rpcUrl);
  }
  return provider;
};

// Get signer (for transactions)
export const getSigner = () => signer;

// Get connected wallet address
export const getWalletAddress = async () => {
  if (signer) {
    return await signer.getAddress();
  }
  return null;
};

// Get balance from blockchain directly
export const getBalance = async () => {
  try {
    const providerInstance = getProvider();
    const address = await getWalletAddress();
    
    if (!address) {
      return null;
    }
    
    const balanceWei = await providerInstance.getBalance(address);
    const balanceMatic = ethers.formatEther(balanceWei);
    return balanceMatic;
  } catch (error) {
    console.error('Failed to get balance:', error);
    return null;
  }
};

// Sign message for authentication
export const signMessage = async (message) => {
  if (!signer) {
    throw new Error('Wallet not connected');
  }
  const signature = await signer.signMessage(message);
  return signature;
};

// Disconnect wallet (clear state)
export const disconnectWallet = () => {
  provider = null;
  signer = null;
};

// Get current network info
export const getNetwork = async () => {
  if (provider) {
    const network = await provider.getNetwork();
    return {
      chainId: Number(network.chainId),
      name: NETWORK_CONFIG.name
    };
  }
  return null;
};