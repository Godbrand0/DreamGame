'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { SuiClientProvider, WalletProvider } from '@mysten/dapp-kit'
import { getFullnodeUrl } from '@mysten/sui.js/client'
import { useState, type ReactNode } from 'react'

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient())

  // Configure networks - OneChain testnet
  const networks = {
    testnet: { 
      url: process.env.NEXT_PUBLIC_ONECHAIN_RPC || getFullnodeUrl('testnet') 
    },
    mainnet: { url: getFullnodeUrl('mainnet') },
  }

  return (
    <QueryClientProvider client={queryClient}>
      <SuiClientProvider networks={networks} defaultNetwork="testnet">
        <WalletProvider autoConnect>
          {children}
        </WalletProvider>
      </SuiClientProvider>
    </QueryClientProvider>
  )
}
