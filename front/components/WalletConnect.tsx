'use client'

import { ConnectButton, useCurrentAccount } from '@mysten/dapp-kit'
import { Wallet } from 'lucide-react'

export default function WalletConnect() {
  const currentAccount = useCurrentAccount()

  return (
    <div className="flex items-center gap-4">
      {currentAccount ? (
        <div className="flex items-center gap-3 bg-slate-800/50 backdrop-blur-lg border border-purple-500/30 rounded-lg px-4 py-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-white font-medium text-sm">
            {currentAccount.address.slice(0, 6)}...{currentAccount.address.slice(-4)}
          </span>
        </div>
      ) : null}
      
      <ConnectButton className="bg-purple-600 hover:bg-purple-700 text-white font-semibold px-6 py-2 rounded-lg transition-all" />
    </div>
  )
}
