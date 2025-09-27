import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAccount, useReadContract, useBlockNumber } from 'wagmi';
import WalletConnect from '../components/WalletConnect';
import { SHOW_CONTRACT_ABI, SHOW_CONTRACT_ADDRESS } from '../abi/ShowContract';

export default function Debug() {
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const { data: blockNumber } = useBlockNumber();
  
  const [refreshKey, setRefreshKey] = useState(0);
  const [showHistory, setShowHistory] = useState([]);

  // Contract read functions
  const { data: currentShowId, refetch: refetchShowId } = useReadContract({
    address: SHOW_CONTRACT_ADDRESS,
    abi: SHOW_CONTRACT_ABI,
    functionName: 'currentShowId',
  });

  const { data: showData, refetch: refetchShowData } = useReadContract({
    address: SHOW_CONTRACT_ADDRESS,
    abi: SHOW_CONTRACT_ABI,
    functionName: 'getShow',
    args: currentShowId ? [currentShowId] : undefined,
  });

  const { data: contractOwner } = useReadContract({
    address: SHOW_CONTRACT_ADDRESS,
    abi: SHOW_CONTRACT_ABI,
    functionName: 'owner',
  });

  const { data: isPaused } = useReadContract({
    address: SHOW_CONTRACT_ADDRESS,
    abi: SHOW_CONTRACT_ABI,
    functionName: 'paused',
  });

  const { data: showDuration } = useReadContract({
    address: SHOW_CONTRACT_ADDRESS,
    abi: SHOW_CONTRACT_ABI,
    functionName: 'SHOW_DURATION',
  });

  const { data: maxParticipants } = useReadContract({
    address: SHOW_CONTRACT_ADDRESS,
    abi: SHOW_CONTRACT_ABI,
    functionName: 'MAX_PARTICIPANTS_PER_SHOW',
  });

  const { data: platformFee } = useReadContract({
    address: SHOW_CONTRACT_ADDRESS,
    abi: SHOW_CONTRACT_ABI,
    functionName: 'PLATFORM_FEE_PERCENTAGE',
  });

  const { data: voteFee } = useReadContract({
    address: SHOW_CONTRACT_ADDRESS,
    abi: SHOW_CONTRACT_ABI,
    functionName: 'VOTE_FEE',
  });

  // Auto-refresh every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setRefreshKey(prev => prev + 1);
      refetchShowId();
      refetchShowData();
    }, 10000);

    return () => clearInterval(interval);
  }, [refetchShowId, refetchShowData]);

  const formatTime = (timestamp) => {
    if (!timestamp) return 'N/A';
    return new Date(Number(timestamp) * 1000).toLocaleString();
  };

  const getTimeRemaining = (endTime) => {
    if (!endTime) return 'N/A';
    const now = Math.floor(Date.now() / 1000);
    const remaining = Number(endTime) - now;
    
    if (remaining <= 0) return 'Show has ended';
    
    const minutes = Math.floor(remaining / 60);
    const seconds = remaining % 60;
    
    return `${minutes}m ${seconds}s`;
  };

  const formatEther = (wei) => {
    if (!wei) return '0';
    return (Number(wei) / 1e18).toFixed(6);
  };

  const serializeBigInt = (obj) => {
    return JSON.stringify(obj, (key, value) =>
      typeof value === 'bigint' ? value.toString() : value
    , 2);
  };

  const isAdmin = address && contractOwner && address.toLowerCase() === contractOwner.toLowerCase();

  return (
    <div className="min-h-screen bg-black text-green-400 font-mono overflow-y-auto">
      {/* Header */}
      <div className="bg-gray-900 border-b border-green-500 p-4 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold">🔍 CONTRACT DEBUG PANEL</h1>
          <div className="flex items-center space-x-4">
            <WalletConnect />
            <button
              onClick={() => {
                setRefreshKey(prev => prev + 1);
                refetchShowId();
                refetchShowData();
              }}
              className="bg-green-600 hover:bg-green-500 text-black px-4 py-2 rounded font-bold"
            >
              🔄 REFRESH
            </button>
            <button
              onClick={() => router.back()}
              className="text-green-400 hover:text-green-300 underline"
            >
              ← BACK
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6 space-y-6 pb-20">
        {/* Connection Status */}
        <div className="bg-gray-900 border border-green-500 rounded-lg p-4">
          <h2 className="text-xl font-bold mb-4">🔗 CONNECTION STATUS</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <span className="text-green-300">Wallet Connected:</span>
              <span className={`ml-2 ${isConnected ? 'text-green-400' : 'text-red-400'}`}>
                {isConnected ? 'YES' : 'NO'}
              </span>
            </div>
            <div>
              <span className="text-green-300">Address:</span>
              <span className="ml-2 text-green-400 font-mono text-sm">
                {address || 'Not connected'}
              </span>
            </div>
            <div>
              <span className="text-green-300">Admin:</span>
              <span className={`ml-2 ${isAdmin ? 'text-green-400' : 'text-red-400'}`}>
                {isAdmin ? 'YES' : 'NO'}
              </span>
            </div>
          </div>
        </div>

        {/* Contract Info */}
        <div className="bg-gray-900 border border-green-500 rounded-lg p-4">
          <h2 className="text-xl font-bold mb-4">📋 CONTRACT INFORMATION</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <span className="text-green-300">Contract Address:</span>
              <div className="text-green-400 font-mono text-sm break-all">
                {SHOW_CONTRACT_ADDRESS}
              </div>
            </div>
            <div>
              <span className="text-green-300">Owner:</span>
              <div className="text-green-400 font-mono text-sm break-all">
                {contractOwner || 'Loading...'}
              </div>
            </div>
            <div>
              <span className="text-green-300">Paused:</span>
              <span className={`ml-2 ${isPaused ? 'text-red-400' : 'text-green-400'}`}>
                {isPaused ? 'YES' : 'NO'}
              </span>
            </div>
            <div>
              <span className="text-green-300">Current Block:</span>
              <span className="ml-2 text-green-400">
                {blockNumber ? blockNumber.toString() : 'Loading...'}
              </span>
            </div>
          </div>
        </div>

        {/* Contract Constants */}
        <div className="bg-gray-900 border border-green-500 rounded-lg p-4">
          <h2 className="text-xl font-bold mb-4">⚙️ CONTRACT CONSTANTS</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <span className="text-green-300">Show Duration:</span>
              <span className="ml-2 text-green-400">
                {showDuration ? `${Number(showDuration)} seconds (${Number(showDuration) / 60} minutes)` : 'Loading...'}
              </span>
            </div>
            <div>
              <span className="text-green-300">Max Participants:</span>
              <span className="ml-2 text-green-400">
                {maxParticipants ? maxParticipants.toString() : 'Loading...'}
              </span>
            </div>
            <div>
              <span className="text-green-300">Platform Fee:</span>
              <span className="ml-2 text-green-400">
                {platformFee ? `${platformFee.toString()}%` : 'Loading...'}
              </span>
            </div>
            <div>
              <span className="text-green-300">Vote Fee:</span>
              <span className="ml-2 text-green-400">
                {voteFee ? `${formatEther(voteFee)} ETH` : 'Loading...'}
              </span>
            </div>
          </div>
        </div>

        {/* Current Show Info */}
        <div className="bg-gray-900 border border-green-500 rounded-lg p-4">
          <h2 className="text-xl font-bold mb-4">🎬 CURRENT SHOW INFORMATION</h2>
          {showData ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <span className="text-green-300">Show ID:</span>
                  <span className="ml-2 text-green-400 font-bold">
                    {showData[0] ? showData[0].toString() : 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-green-300">Status:</span>
                  <span className={`ml-2 font-bold ${showData[3] ? 'text-green-400' : 'text-red-400'}`}>
                    {showData[3] ? 'ACTIVE' : 'INACTIVE'}
                  </span>
                </div>
                <div>
                  <span className="text-green-300">Start Time:</span>
                  <span className="ml-2 text-green-400">
                    {formatTime(showData[1])}
                  </span>
                </div>
                <div>
                  <span className="text-green-300">End Time:</span>
                  <span className="ml-2 text-green-400">
                    {formatTime(showData[2])}
                  </span>
                </div>
                <div>
                  <span className="text-green-300">Time Remaining:</span>
                  <span className="ml-2 text-green-400 font-bold">
                    {getTimeRemaining(showData[2])}
                  </span>
                </div>
                <div>
                  <span className="text-green-300">Entry Fee:</span>
                  <span className="ml-2 text-green-400">
                    {formatEther(showData[5])} ETH
                  </span>
                </div>
                <div>
                  <span className="text-green-300">Total Prize:</span>
                  <span className="ml-2 text-green-400 font-bold">
                    {formatEther(showData[6])} ETH
                  </span>
                </div>
                <div>
                  <span className="text-green-300">Winner Agent ID:</span>
                  <span className="ml-2 text-green-400">
                    {showData[7] ? showData[7].toString() : 'Not determined'}
                  </span>
                </div>
              </div>
              
              {/* Participating Agents */}
              <div>
                <span className="text-green-300">Participating Agents:</span>
                <div className="mt-2">
                  {showData[8] && showData[8].length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {showData[8].map((agentId, index) => (
                        <span
                          key={index}
                          className="bg-green-900 text-green-400 px-2 py-1 rounded text-sm font-mono"
                        >
                          Agent #{agentId.toString()}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-gray-400">No agents participating</span>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-gray-400">
              {currentShowId ? 'Loading show data...' : 'No active show'}
            </div>
          )}
        </div>

        {/* Raw Data */}
        <div className="bg-gray-900 border border-green-500 rounded-lg p-4">
          <h2 className="text-xl font-bold mb-4">🔧 RAW CONTRACT DATA</h2>
          <div className="space-y-4">
            <div>
              <span className="text-green-300">Current Show ID:</span>
              <pre className="text-green-400 font-mono text-sm mt-1">
                {serializeBigInt(currentShowId)}
              </pre>
            </div>
            <div>
              <span className="text-green-300">Show Data:</span>
              <pre className="text-green-400 font-mono text-sm mt-1 overflow-x-auto">
                {serializeBigInt(showData)}
              </pre>
            </div>
          </div>
        </div>

        {/* Refresh Info */}
        <div className="bg-gray-900 border border-green-500 rounded-lg p-4">
          <h2 className="text-xl font-bold mb-4">🔄 REFRESH INFORMATION</h2>
          <div className="text-green-300">
            <p>• Auto-refresh every 10 seconds</p>
            <p>• Last refresh key: {refreshKey}</p>
            <p>• Manual refresh available via button above</p>
          </div>
        </div>
      </div>
    </div>
  );
}
