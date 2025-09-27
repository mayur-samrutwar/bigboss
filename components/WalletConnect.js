'use client'

import { useAccount, useDisconnect } from 'wagmi'
import { useAppKit } from '@reown/appkit/react'

export default function WalletConnect() {
  const { address, isConnected } = useAccount()
  const { open } = useAppKit()
  const { disconnect } = useDisconnect()

  const handleConnect = () => {
    open()
  }

  const handleDisconnect = () => {
    disconnect()
  }

  if (isConnected) {
    return (
      <div className="flex items-center space-x-4">
        <div className="text-green-400 font-mono text-sm">
          {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'Connected'}
        </div>
        <button
          onClick={handleDisconnect}
          className="bg-red-500 hover:bg-red-400 text-white font-bold py-2 px-4 rounded-lg border-2 border-red-300 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-red-500/50"
          style={{
            fontFamily: 'monospace',
            textShadow: '0 0 10px #ff0000'
          }}
        >
          DISCONNECT
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={handleConnect}
      className="bg-blue-500 hover:bg-blue-400 text-white font-bold py-3 px-6 rounded-lg border-2 border-blue-300 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-blue-500/50"
      style={{
        fontFamily: 'monospace',
        textShadow: '0 0 10px #0066ff'
      }}
    >
      CONNECT WALLET
    </button>
  )
}
