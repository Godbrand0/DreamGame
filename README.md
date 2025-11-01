# OneChain Wallet Integration Guide

This guide provides comprehensive instructions on how to integrate your Next.js and Tailwind CSS frontend with the OneChain wallet ecosystem.

## Overview

OneChain provides a robust wallet infrastructure that allows web applications to interact with the OneChain blockchain. This integration enables users to connect their wallets, sign transactions, manage assets, and interact with smart contracts directly from your web application.

## Prerequisites

- Node.js 18+ installed
- Next.js project set up with Tailwind CSS
- Basic understanding of React hooks and state management
- OneChain wallet browser extension installed (for testing)

## Installation

### Required Packages

Install the OneChain SDK and related dependencies:

```bash
npm install @onechain/wallet-sdk @onechain/client
npm install @onechain/react-hooks
```

### TypeScript Support

For TypeScript projects, install the type definitions:

```bash
npm install --save-dev @types/node
```

## Wallet Connection Methods

### 1. OneChain Browser Extension

The most common method is connecting through the OneChain browser extension.

#### Detection and Connection

```typescript
// Check if OneChain extension is installed
const isOneChainInstalled = () => {
  return typeof window !== 'undefined' && window.onechain;
};

// Connect to wallet
const connectWallet = async () => {
  if (!isOneChainInstalled()) {
    throw new Error('OneChain extension not installed');
  }
  
  try {
    const accounts = await window.onechain.request({
      method: 'one_requestAccounts',
    });
    return accounts[0]; // Return first connected account
  } catch (error) {
    console.error('Failed to connect wallet:', error);
    throw error;
  }
};
```

### 2. Mobile Wallet Integration

For mobile users, integrate with deep linking:

```typescript
const connectMobileWallet = () => {
  const deepLink = 'onechain://dapp/connect?dappUrl=' + encodeURIComponent(window.location.href);
  window.location.href = deepLink;
};
```

## React Integration

### Wallet Provider Setup

Create a wallet context to manage wallet state across your application:

```typescript
// contexts/WalletContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';

interface WalletContextType {
  isConnected: boolean;
  address: string | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  signTransaction: (transaction: any) => Promise<string>;
}

const WalletContext = createContext<WalletContextType | null>(null);

export const WalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [address, setAddress] = useState<string | null>(null);

  // Implementation details...
};
```

### Custom Hook for Wallet Operations

```typescript
// hooks/useWallet.ts
import { useContext } from 'react';
import { WalletContext } from '../contexts/WalletContext';

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within WalletProvider');
  }
  return context;
};
```

## Transaction Handling

### Sending Transactions

```typescript
const sendTransaction = async (recipient: string, amount: string) => {
  try {
    const transaction = {
      type: 'transfer',
      recipient,
      amount,
      currency: 'OCT',
    };

    const signedTx = await window.onechain.request({
      method: 'one_signTransaction',
      params: [transaction],
    });

    const result = await window.onechain.request({
      method: 'one_sendTransaction',
      params: [signedTx],
    });

    return result;
  } catch (error) {
    console.error('Transaction failed:', error);
    throw error;
  }
};
```

### Smart Contract Interaction

```typescript
const callSmartContract = async (contractAddress: string, functionName: string, args: any[]) => {
  try {
    const callData = {
      contractAddress,
      functionName,
      args,
    };

    const result = await window.onechain.request({
      method: 'one_callContract',
      params: [callData],
    });

    return result;
  } catch (error) {
    console.error('Contract call failed:', error);
    throw error;
  }
};
```

## UI Components with Tailwind CSS

### Connect Wallet Button

```typescript
// components/ConnectWalletButton.tsx
import React from 'react';
import { useWallet } from '../hooks/useWallet';

export const ConnectWalletButton: React.FC = () => {
  const { isConnected, address, connect, disconnect } = useWallet();

  if (isConnected) {
    return (
      <div className="flex items-center space-x-4">
        <span className="text-sm text-gray-600">
          {address?.slice(0, 6)}...{address?.slice(-4)}
        </span>
        <button
          onClick={disconnect}
          className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
        >
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={connect}
      className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
    >
      Connect Wallet
    </button>
  );
};
```

### Transaction Status Component

```typescript
// components/TransactionStatus.tsx
import React from 'react';

interface TransactionStatusProps {
  status: 'pending' | 'success' | 'error';
  message?: string;
  txHash?: string;
}

export const TransactionStatus: React.FC<TransactionStatusProps> = ({ 
  status, 
  message, 
  txHash 
}) => {
  const getStatusColor = () => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'success': return 'bg-green-100 text-green-800';
      case 'error': return 'bg-red-100 text-red-800';
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'pending': return '⏳';
      case 'success': return '✅';
      case 'error': return '❌';
    }
  };

  return (
    <div className={`p-4 rounded-lg ${getStatusColor()}`}>
      <div className="flex items-center space-x-2">
        <span className="text-lg">{getStatusIcon()}</span>
        <span className="font-medium">{message}</span>
      </div>
      {txHash && (
        <div className="mt-2 text-sm">
          <span>Transaction: </span>
          <a 
            href={`https://explorer.onechain.cc/tx/${txHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:no-underline"
          >
            {txHash.slice(0, 10)}...{txHash.slice(-8)}
          </a>
        </div>
      )}
    </div>
  );
};
```

## Network Configuration

### Environment Setup

Configure your application for different OneChain networks:

```typescript
// config/networks.ts
export const NETWORKS = {
  mainnet: {
    name: 'Mainnet',
    rpcUrl: 'https://rpc-mainnet.onelabs.cc:443',
    chainId: 'onechain-mainnet',
  },
  testnet: {
    name: 'Testnet',
    rpcUrl: 'https://rpc-testnet.onelabs.cc:443',
    chainId: 'onechain-testnet',
  },
  devnet: {
    name: 'Devnet',
    rpcUrl: 'https://rpc-devnet.onelabs.cc:443',
    chainId: 'onechain-devnet',
  },
};
```

### Network Switching

```typescript
const switchNetwork = async (networkName: string) => {
  try {
    await window.onechain.request({
      method: 'one_switchNetwork',
      params: [{ chainId: NETWORKS[networkName].chainId }],
    });
  } catch (error) {
    console.error('Failed to switch network:', error);
    throw error;
  }
};
```

## Error Handling

### Common Error Scenarios

```typescript
// utils/walletErrors.ts
export const handleWalletError = (error: any) => {
  if (error.code === 4001) {
    // User rejected the request
    return 'Transaction rejected by user';
  } else if (error.code === -32603) {
    // Internal error
    return 'Wallet internal error. Please try again.';
  } else if (error.message?.includes('not installed')) {
    return 'OneChain wallet not installed. Please install the extension.';
  }
  return error.message || 'Unknown wallet error occurred';
};
```

## Security Best Practices

### 1. Validate Transactions

Always validate transaction data before sending:

```typescript
const validateTransaction = (tx: any) => {
  if (!tx.recipient || !tx.amount) {
    throw new Error('Invalid transaction data');
  }
  
  if (parseFloat(tx.amount) <= 0) {
    throw new Error('Amount must be positive');
  }
  
  // Add more validation as needed
};
```

### 2. Secure Storage

Never store private keys or sensitive data in localStorage:

```typescript
// Use secure storage for non-sensitive data only
const storeWalletPreferences = (preferences: any) => {
  sessionStorage.setItem('walletPrefs', JSON.stringify(preferences));
};
```

### 3. Input Sanitization

Sanitize all user inputs before processing:

```typescript
const sanitizeAddress = (address: string) => {
  if (!address.startsWith('0x') || address.length !== 66) {
    throw new Error('Invalid address format');
  }
  return address;
};
```

## Testing

### Mock Wallet for Testing

Create a mock wallet for development and testing:

```typescript
// utils/mockWallet.ts
export const mockWallet = {
  request: async ({ method, params }: any) => {
    switch (method) {
      case 'one_requestAccounts':
        return ['0x1234567890123456789012345678901234567890'];
      case 'one_signTransaction':
        return '0xsignedtransaction';
      default:
        throw new Error('Method not supported in mock');
    }
  },
};
```

## Deployment Considerations

### 1. Environment Variables

Configure environment-specific settings:

```bash
# .env.local
NEXT_PUBLIC_ONECHAIN_NETWORK=testnet
NEXT_PUBLIC_RPC_URL=https://rpc-testnet.onelabs.cc:443
```

### 2. Bundle Optimization

Optimize your bundle for wallet integration:

```javascript
// next.config.js
module.exports = {
  webpack: (config) => {
    config.externals = {
      ...config.externals,
      'onechain': 'window.onechain',
    };
    return config;
  },
};
```

## Troubleshooting

### Common Issues

1. **Extension Not Detected**: Ensure users have the OneChain extension installed
2. **Connection Timeouts**: Implement proper timeout handling
3. **Network Mismatches**: Verify network configuration matches wallet settings
4. **Transaction Failures**: Check gas limits and account balances

### Debug Tools

Use browser developer tools to debug wallet interactions:

```typescript
// Enable debug mode
if (process.env.NODE_ENV === 'development') {
  window.onechain?.on('debug', (event) => {
    console.log('OneChain Debug:', event);
  });
}
```

## Resources

- [OneChain Documentation](https://docs.onechain.cc)
- [OneChain Explorer](https://explorer.onechain.cc)
- [Wallet Extension Download](https://wallet.onechain.cc)
- [Developer Discord](https://discord.gg/onechain)

## Support

For integration support:
- Check the [GitHub Issues](https://github.com/one-chain-labs/onechain/issues)
- Join the [Developer Community](https://community.onechain.cc)
- Review the [API Reference](https://api.onechain.cc)

---

This guide provides a comprehensive foundation for integrating OneChain wallet functionality into your Next.js and Tailwind CSS application. For more advanced use cases and specific implementation details, refer to the official OneChain documentation.