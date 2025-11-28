'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { SuiClientProvider, WalletProvider } from '@mysten/dapp-kit'
import { getFullnodeUrl } from '@mysten/sui/client'
import { useState, type ReactNode } from 'react'

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient())

  // Configure networks - OneChain testnet
  const onechainRpc = process.env.NEXT_PUBLIC_ONECHAIN_RPC
  console.log('OneChain RPC from env:', onechainRpc)

  const networks = {
    onechain: {
      url: onechainRpc || 'https://rpc-testnet.onelabs.cc:443'
    },
    testnet: {
      url: getFullnodeUrl('testnet')
    },
    mainnet: { url: getFullnodeUrl('mainnet') },
  }

  console.log('Configured networks:', networks)
  console.log('⚠️ IMPORTANT: Make sure your wallet is connected to OneChain Testnet RPC:', onechainRpc)

  return (
    <QueryClientProvider client={queryClient}>
      <SuiClientProvider networks={networks} defaultNetwork="onechain">
        <WalletProvider autoConnect>
          {children}
        </WalletProvider>
      </SuiClientProvider>
    </QueryClientProvider>
  )
}
