import WalletConnect from '../components/WalletConnect';
import Character from '../components/Character';
import EventPopup from '../components/EventPopup';
import WinnerPopup from '../components/WinnerPopup';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther } from 'viem';
import { SHOW_CONTRACT_ABI, SHOW_CONTRACT_ADDRESS, PREDICTION_MARKET_ABI, PREDICTION_MARKET_ADDRESS } from '../lib/contract';

export default function App() {
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const [scrollPosition, setScrollPosition] = useState(0);
  const [imageWidth, setImageWidth] = useState(0);
  const [imageHeight, setImageHeight] = useState(0);
  const [maxScroll, setMaxScroll] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedWinner, setSelectedWinner] = useState('');
  const [contracts, setContracts] = useState(1);
  const [selectedVote, setSelectedVote] = useState('');
  const [votingOpen, setVotingOpen] = useState(false);
  const [selectedCharacter, setSelectedCharacter] = useState(null);
  const [characterInfoOpen, setCharacterInfoOpen] = useState(false);
  const [showInfo, setShowInfo] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [newsOpen, setNewsOpen] = useState(false);
  const [eliminationNotification, setEliminationNotification] = useState(null);
  const [eliminationHistory, setEliminationHistory] = useState([]);
  const [newsUpdates, setNewsUpdates] = useState([]);
  const [currentShowNews, setCurrentShowNews] = useState([]);
  const [agentNews, setAgentNews] = useState([]);
  const [lastPollTime, setLastPollTime] = useState(new Date().toISOString());
  
  // Status polling states
  const [showStatus, setShowStatus] = useState(null);
  const [statusPollingActive, setStatusPollingActive] = useState(false);
  const [lastStatusPollTime, setLastStatusPollTime] = useState(new Date().toISOString());
  
  // Elimination polling states
  const [eliminationPollingActive, setEliminationPollingActive] = useState(false);
  const [lastEliminationPollTime, setLastEliminationPollTime] = useState(new Date().toISOString());
  
  // Popup states
  const [eventPopupOpen, setEventPopupOpen] = useState(false);
  const [winnerPopupOpen, setWinnerPopupOpen] = useState(false);
  const [currentEventData, setCurrentEventData] = useState(null);
  const [currentWinnerData, setCurrentWinnerData] = useState(null);
  const [userInput, setUserInput] = useState('');

  // Contract read functions
  const { data: currentShowId } = useReadContract({
    address: SHOW_CONTRACT_ADDRESS,
    abi: SHOW_CONTRACT_ABI,
    functionName: 'currentShowId',
  });

  const { data: nextShowId } = useReadContract({
    address: SHOW_CONTRACT_ADDRESS,
    abi: SHOW_CONTRACT_ABI,
    functionName: 'nextShowId',
  });

  const { data: currentShowData } = useReadContract({
    address: SHOW_CONTRACT_ADDRESS,
    abi: SHOW_CONTRACT_ABI,
    functionName: 'getCurrentShow',
  });

  const { data: nextShowData } = useReadContract({
    address: SHOW_CONTRACT_ADDRESS,
    abi: SHOW_CONTRACT_ABI,
    functionName: 'getNextShow',
  });

  const { data: showParticipants } = useReadContract({
    address: SHOW_CONTRACT_ADDRESS,
    abi: SHOW_CONTRACT_ABI,
    functionName: 'getShowParticipants',
    args: currentShowId ? [currentShowId] : undefined,
  });

  const { data: nextShowParticipants } = useReadContract({
    address: SHOW_CONTRACT_ADDRESS,
    abi: SHOW_CONTRACT_ABI,
    functionName: 'getNextShowParticipants',
  });

  const { data: agentVoteCounts } = useReadContract({
    address: SHOW_CONTRACT_ADDRESS,
    abi: SHOW_CONTRACT_ABI,
    functionName: 'getAgentVoteCounts',
    args: currentShowId && participants.length > 0 ? [currentShowId, participants.map(p => BigInt(p.agentId))] : undefined,
  });

  // PredictionMarket contract reads
  const { data: predictionMarketShowInfo } = useReadContract({
    address: PREDICTION_MARKET_ADDRESS,
    abi: PREDICTION_MARKET_ABI,
    functionName: 'getCurrentShowInfo',
  });

  const { data: showPredictionInfo } = useReadContract({
    address: PREDICTION_MARKET_ADDRESS,
    abi: PREDICTION_MARKET_ABI,
    functionName: 'getShowPredictionInfo',
    args: currentShowId ? [currentShowId] : undefined,
  });

  // Contract write functions
  const { writeContract, data: hash, isPending, isConfirming, error: writeError } = useWriteContract();
  const { isLoading: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });


  const handleBuy = async () => {
    if (!selectedWinner) {
      setError('Please select a winner first!');
      return;
    }

    if (!isConnected) {
      setError('Please connect your wallet to make predictions!');
      return;
    }

    if (!currentShowId || !showInfo?.isActive) {
      setError('No active show available for predictions!');
      return;
    }

    try {
      setError('');
      // Prediction fee is 0.01 ETH per contract - convert to wei
      const predictionFee = parseEther((0.01 * contracts).toString());
      
      writeContract({
        address: PREDICTION_MARKET_ADDRESS,
        abi: PREDICTION_MARKET_ABI,
        functionName: 'placePrediction',
        args: [BigInt(currentShowId), BigInt(selectedWinner), BigInt(contracts)],
        value: predictionFee,
      });
    } catch (err) {
      setError('Failed to place prediction: ' + err.message);
    }
  };

  const handleVote = async () => {
    if (!selectedVote) {
      setError('Please select a contestant to vote for!');
      return;
    }

    if (!isConnected) {
      setError('Please connect your wallet to vote!');
      return;
    }

    if (!currentShowId || !showInfo?.isActive) {
      setError('No active show to vote in!');
      return;
    }

    try {
      setError('');
      // Vote fee is 0.01 ETH - convert to wei
      const voteFee = parseEther('0.01');
      
      writeContract({
        address: SHOW_CONTRACT_ADDRESS,
        abi: SHOW_CONTRACT_ABI,
        functionName: 'voteForAgent',
        args: [BigInt(currentShowId), BigInt(selectedVote)],
        value: voteFee,
      });
    } catch (err) {
      setError('Failed to cast vote: ' + err.message);
    }
  };

  const handleCharacterClick = (characterData) => {
    setSelectedCharacter(characterData);
    setCharacterInfoOpen(true);
    
    // Fetch news for this specific agent
    if (characterData?.participant?.agentId) {
      fetchAgentNews(characterData.participant.agentId);
    }
  };

  // Function to trigger elimination
  const triggerElimination = async () => {
    if (!currentShowId) {
      setError('No active show found');
      return;
    }

    try {
      setError('');
      const response = await fetch('/api/elimination/calculateElimination', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          showId: currentShowId.toString()
        })
      });

      const data = await response.json();

      if (data.success) {
        // Show elimination notification
        setEliminationNotification({
          eliminatedAgent: data.eliminatedAgent,
          eliminationReason: data.eliminationReason,
          remainingAgents: data.remainingAgents,
          riskRankings: data.riskRankings
        });

        // Add to elimination history
        setEliminationHistory(prev => [{
          id: Date.now(),
          timestamp: new Date().toISOString(),
          eliminatedAgent: data.eliminatedAgent,
          eliminationReason: data.eliminationReason,
          remainingCount: data.remainingAgents.length
        }, ...prev]);

        setSuccess(`Elimination successful: ${data.eliminatedAgent.name} has been eliminated`);
        
        // Refresh participants data
        setTimeout(() => {
          window.location.reload();
        }, 3000);

      } else {
        setError(data.error || 'Elimination failed');
      }
    } catch (error) {
      console.error('Error triggering elimination:', error);
      setError('Failed to trigger elimination');
    }
  };

  // Function to dismiss elimination notification
  const dismissEliminationNotification = () => {
    setEliminationNotification(null);
  };

  // Test functions for popups
  const triggerEventPopup = () => {
    setCurrentEventData({
      content: "Agent #3 has formed a secret alliance with Agent #7! This unexpected partnership could change the entire game dynamics."
    });
    setEventPopupOpen(true);
  };

  const triggerWinnerPopup = () => {
    setCurrentWinnerData({
      characterName: "Agent #5",
      agentId: "5"
    });
    setWinnerPopupOpen(true);
  };

  // Function to add news update
  const addNewsUpdate = (content, type) => {
    const newsItem = {
      id: Date.now(),
      content: content,
      type: type,
      time: 'Just now'
    };
    setNewsUpdates(prev => [newsItem, ...prev.slice(0, 9)]); // Keep only last 10 items
  };

  // Function to fetch recent AI actions as news
  const fetchRecentActions = async () => {
    if (!currentShowId) return;
    
    try {
      const response = await fetch('/api/manageShow', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          showId: currentShowId.toString(),
          action: 'get_show_status'
        })
      });

      const data = await response.json();
      
      if (data.success && data.result.agents) {
        // Generate news based on current show state
        const aliveAgents = data.result.agents.filter(agent => agent.isAlive);
        const eliminatedCount = data.result.totalCount - aliveAgents.length;
        
        if (eliminatedCount > 0) {
          addNewsUpdate(`${eliminatedCount} agent(s) have been eliminated from the show!`, 'elimination');
        }
        
        // Add news about high-risk agents
        const highRiskAgents = aliveAgents.filter(agent => agent.riskScore > 0);
        if (highRiskAgents.length > 0) {
          const riskiestAgent = highRiskAgents.reduce((prev, current) => 
            prev.riskScore > current.riskScore ? prev : current
          );
          addNewsUpdate(`${riskiestAgent.name} is at high risk of elimination!`, 'general');
        }
      }
    } catch (error) {
      console.error('Error fetching recent actions:', error);
    }
  };

  // Function to fetch current show news
  const fetchCurrentShowNews = async () => {
    if (!currentShowId) return;
    
    try {
      const response = await fetch(`/api/news?showId=${currentShowId}`);
      const data = await response.json();
      
      if (data.success) {
        setCurrentShowNews(data.data);
        console.log(`📰 Fetched ${data.data.length} news items for show ${currentShowId}`);
      }
    } catch (error) {
      console.error('Error fetching current show news:', error);
    }
  };

  // Function to fetch agent-specific news
  const fetchAgentNews = async (agentId) => {
    if (!currentShowId || !agentId) return;
    
    try {
      const response = await fetch(`/api/news/agent?showId=${currentShowId}&agentId=${agentId}`);
      const data = await response.json();
      
      if (data.success) {
        setAgentNews(data.data);
        console.log(`📰 Fetched ${data.data.length} news items for agent ${agentId}`);
      }
    } catch (error) {
      console.error('Error fetching agent news:', error);
    }
  };

  // Function to poll for new news
  const pollForNewNews = async () => {
    if (!currentShowId) return;
    
    try {
      const response = await fetch(`/api/news/poll?showId=${currentShowId}&lastPollTime=${lastPollTime}`);
      const data = await response.json();
      
      if (data.success && data.hasNewNews) {
        // Show alert for new news
        setSuccess(`🚨 ${data.message}`);
        // Refresh current show news
        fetchCurrentShowNews();
        // Update last poll time
        setLastPollTime(new Date().toISOString());
      }
    } catch (error) {
      console.error('Error polling for new news:', error);
    }
  };

  // Function to poll show status
  const pollShowStatus = async () => {
    if (!currentShowId) return;
    
    try {
      const response = await fetch('/api/pollCheckStatus', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          showId: currentShowId.toString(),
          autoProcess: true
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        console.log(`📊 Status poll result:`, {
          status: data.status,
          reason: data.reason,
          aliveCount: data.showInfo?.aliveCount,
          winnerAgentId: data.showInfo?.winnerAgentId
        });
        
        // Update show status
        setShowStatus(data);
        setLastStatusPollTime(new Date().toISOString());
        
        // Handle status changes
        if (data.status === 'AUTO_ENDED' || data.status === 'ENDED') {
          setSuccess(`🏁 Show ${currentShowId} has ended! ${data.reason}`);
        } else if (data.status === 'READY_TO_END') {
          setSuccess(`🎯 Show ready to end! ${data.reason}`);
        } else if (data.status === 'NO_WINNER') {
          setSuccess(`⚠️ No winner found! ${data.reason}`);
        }
        
        // Show winner popup if show was processed
        if (data.processed && data.showInfo?.winnerAgentId) {
          setCurrentWinnerData({
            winnerAgentId: data.showInfo.winnerAgentId,
            showId: currentShowId,
            transactionHash: data.transaction?.hash
          });
          setWinnerPopupOpen(true);
        }
        
      } else {
        console.error('Status polling failed:', data.error);
      }
    } catch (error) {
      console.error('Error polling show status:', error);
    }
  };

  // Function to poll for eliminations
  const pollElimination = async () => {
    if (!currentShowId) return;
    
    try {
      const response = await fetch('/api/elimination/calculateElimination', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          showId: currentShowId.toString()
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        console.log(`💀 Elimination poll result:`, {
          eliminatedAgent: data.eliminatedAgent?.name,
          eliminationReason: data.eliminationReason,
          remainingAgents: data.remainingAgents?.length
        });
        
        // Update elimination polling time
        setLastEliminationPollTime(new Date().toISOString());
        
        // Show elimination notification
        setEliminationNotification({
          eliminatedAgent: data.eliminatedAgent,
          eliminationReason: data.eliminationReason,
          remainingAgents: data.remainingAgents,
          riskRankings: data.riskRankings
        });

        // Add to elimination history
        setEliminationHistory(prev => [{
          id: Date.now(),
          timestamp: new Date().toISOString(),
          eliminatedAgent: data.eliminatedAgent,
          eliminationReason: data.eliminationReason,
          remainingCount: data.remainingAgents?.length || 0
        }, ...prev]);

        setSuccess(`💀 Elimination: ${data.eliminatedAgent?.name} has been eliminated! ${data.eliminationReason}`);
        
        // Refresh participants data after elimination
        setTimeout(() => {
          window.location.reload();
        }, 3000);
        
      } else {
        console.log(`No elimination needed: ${data.error || 'No agents to eliminate'}`);
      }
    } catch (error) {
      console.error('Error polling elimination:', error);
    }
  };

  // Update show info when contract data changes
  useEffect(() => {
    if (currentShowData) {
      const [showId, startTime, endTime, isActive, entryFee, totalPrize, participantCount] = currentShowData;
      setShowInfo({
        showId: Number(showId),
        startTime: Number(startTime) * 1000,
        endTime: Number(endTime) * 1000,
        isActive,
        entryFee: (Number(entryFee) / 1e18).toFixed(4),
        totalPrize: (Number(totalPrize) / 1e18).toFixed(4),
        participantCount: Number(participantCount)
      });
    }
  }, [currentShowData]);

  // Function to fetch agent names
  const fetchAgentNames = async (agentIds) => {
    try {
      const agentNames = {};
      for (const agentId of agentIds) {
        try {
          const response = await fetch(`/api/traits/getAgentTraits?agentId=${agentId}`);
          const data = await response.json();
          if (data.success) {
            agentNames[agentId] = data.agentName;
          } else {
            agentNames[agentId] = `Agent #${agentId}`;
          }
        } catch (error) {
          console.error(`Error fetching name for agent ${agentId}:`, error);
          agentNames[agentId] = `Agent #${agentId}`;
        }
      }
      return agentNames;
    } catch (error) {
      console.error('Error fetching agent names:', error);
      return {};
    }
  };

  // Update participants when show participants data changes
  useEffect(() => {
    console.log('Current show participants data:', showParticipants);
    console.log('Current show ID:', currentShowId);
    
    if (showParticipants) {
      const [agentIds, participantAddresses] = showParticipants;
      console.log('Agent IDs:', agentIds);
      console.log('Participant addresses:', participantAddresses);
      
      // Fetch agent names
      fetchAgentNames(agentIds.map(id => id.toString())).then(agentNames => {
        setParticipants(agentIds.map((id, index) => ({
          agentId: id.toString(),
          address: participantAddresses[index],
          name: agentNames[id.toString()] || `Agent #${id.toString()}`
        })));
      });
    } else {
      console.log('No show participants data, setting empty array');
      setParticipants([]);
    }
  }, [showParticipants, currentShowId]);

  // Fetch news updates when show data changes
  useEffect(() => {
    if (currentShowId && showInfo?.isActive) {
      fetchRecentActions();
      fetchCurrentShowNews();
    }
  }, [currentShowId, showInfo]);

  // Poll for new news every 15 seconds when show is active
  useEffect(() => {
    if (!currentShowId || !showInfo?.isActive) {
      return;
    }

    const pollInterval = setInterval(() => {
      pollForNewNews();
    }, 60000); // Poll every 1 minute

    return () => clearInterval(pollInterval);
  }, [currentShowId, showInfo?.isActive, lastPollTime]);

  // Poll show status every 30 seconds when show is active
  useEffect(() => {
    if (!currentShowId || !showInfo?.isActive) {
      setStatusPollingActive(false);
      return;
    }

    setStatusPollingActive(true);
    console.log(`🔄 Starting status polling for show ${currentShowId} every 30 seconds`);

    const statusPollInterval = setInterval(() => {
      pollShowStatus();
    }, 30000); // Poll every 30 seconds

    return () => {
      clearInterval(statusPollInterval);
      setStatusPollingActive(false);
      console.log(`⏹️ Stopped status polling for show ${currentShowId}`);
    };
  }, [currentShowId, showInfo?.isActive]);

  // Poll for eliminations every 60 seconds when show is active
  useEffect(() => {
    if (!currentShowId || !showInfo?.isActive) {
      setEliminationPollingActive(false);
      return;
    }

    setEliminationPollingActive(true);
    console.log(`💀 Starting elimination polling for show ${currentShowId} every 60 seconds`);

    const eliminationPollInterval = setInterval(() => {
      pollElimination();
    }, 60000); // Poll every 60 seconds (1 minute)

    return () => {
      clearInterval(eliminationPollInterval);
      setEliminationPollingActive(false);
      console.log(`⏹️ Stopped elimination polling for show ${currentShowId}`);
    };
  }, [currentShowId, showInfo?.isActive]);

  // Handle transaction success
  useEffect(() => {
    if (isConfirmed) {
      setSuccess('Transaction confirmed successfully!');
      setError('');
      // Clear selected vote and prediction after successful transaction
      setSelectedVote('');
      setSelectedWinner('');
    }
  }, [isConfirmed]);

  // Handle write errors
  useEffect(() => {
    if (writeError) {
      setError('Transaction failed: ' + writeError.message);
    }
  }, [writeError]);
  
  // Calculate max scroll based on image dimensions (9270 × 3700)
  // Image aspect ratio: 9270/3700 = 2.5
  useEffect(() => {
    const calculateDimensions = () => {
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const imageAspectRatio = 9270 / 3700; // 2.5
      const imageDisplayWidth = viewportHeight * imageAspectRatio;
      const maxScrollValue = Math.max(0, imageDisplayWidth - viewportWidth);
      
      setImageWidth(imageDisplayWidth);
      setImageHeight(viewportHeight);
      setMaxScroll(maxScrollValue);
    };
    
    calculateDimensions();
    window.addEventListener('resize', calculateDimensions);
    return () => window.removeEventListener('resize', calculateDimensions);
  }, []);

  const scrollLeft = () => {
    setScrollPosition(prev => {
      const newPos = prev - 200;
      console.log('Scrolling left, new position:', newPos);
      return Math.max(0, newPos);
    });
  };

  const scrollRight = () => {
    setScrollPosition(prev => {
      const newPos = prev + 200;
      console.log('Scrolling right, new position:', newPos);
      return Math.min(maxScroll, newPos);
    });
  };

  return (
    <div className="w-full bg-black relative overflow-hidden" style={{ height: '100vh' }}>
      {/* 2D Room Background - Match image height, horizontal scrollable */}
      <div 
        className="bg-no-repeat transition-transform duration-300 ease-out"
        style={{
          backgroundImage: 'url(/room.png)',
          backgroundSize: 'contain', // Show full image without cropping
          backgroundPosition: '0% 0%',
          backgroundRepeat: 'no-repeat',
          imageRendering: 'pixelated',
          height: '100vh', // Full viewport height
          width: `${imageWidth}px`, // Calculate width based on image aspect ratio
          transform: `translateX(-${scrollPosition}px)`, // Use transform for scrolling
        }}
      />
      
      {/* Characters - Positioned relative to the image container */}
      {imageWidth > 0 && imageHeight > 0 && (
        <div 
          className="absolute top-0 left-0"
          style={{
            width: `${imageWidth}px`,
            height: `${imageHeight}px`,
            transform: `translateX(-${scrollPosition}px)`,
          }}
        >
          {/* Render characters based on participants count */}
          {(() => {
            console.log('Rendering characters. Participants count:', participants.length);
            console.log('Participants:', participants);
            
            if (participants.length > 0) {
              return participants.map((participant, index) => (
                <Character 
                  key={participant.agentId}
                  roomWidth={imageWidth}
                  roomHeight={imageHeight}
                  imageWidth={imageWidth}
                  imageHeight={imageHeight}
                  onCharacterClick={handleCharacterClick}
                  participant={participant}
                  index={index}
                />
              ));
            } else {
              console.log('No participants, showing 3 placeholder characters');
              return Array.from({ length: 3 }, (_, index) => (
          <Character 
                  key={`placeholder-${index}`}
            roomWidth={imageWidth}
            roomHeight={imageHeight}
            imageWidth={imageWidth}
            imageHeight={imageHeight}
            onCharacterClick={handleCharacterClick}
                  participant={null}
                  index={index}
          />
              ));
            }
          })()}
        </div>
      )}

      {/* Wallet Connect Button - Bottom Right */}
      <div className="absolute bottom-4 right-4 z-10">
        <WalletConnect />
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="absolute top-20 right-4 z-10 bg-green-900/20 border border-green-500 text-green-400 font-mono p-4 rounded max-w-sm">
          SUCCESS: {success}
        </div>
      )}
      {error && (
        <div className="absolute top-20 right-4 z-10 bg-red-900/20 border border-red-500 text-red-400 font-mono p-4 rounded max-w-sm">
          ERROR: {error}
        </div>
      )}

      {/* Show Status Display - Top Left */}
      {showInfo && (
        <div className="absolute top-4 left-4 z-10 bg-black/90 backdrop-blur-sm border border-green-500 rounded-lg p-4 max-w-sm">
          <h3 className="text-green-400 font-mono text-lg mb-2">SHOW STATUS</h3>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-green-300 font-mono">Show ID:</span>
              <span className="text-green-400 font-mono">{showInfo.showId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-green-300 font-mono">Status:</span>
              <span className={`font-mono ${showInfo.isActive ? 'text-green-400' : 'text-red-400'}`}>
                {showInfo.isActive ? 'ACTIVE' : 'INACTIVE'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-green-300 font-mono">Participants:</span>
              <span className="text-green-400 font-mono">{showInfo.participantCount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-green-300 font-mono">Prize Pool:</span>
              <span className="text-green-400 font-mono">{showInfo.totalPrize} ETH</span>
            </div>
            {showInfo.isActive && (
              <div className="flex justify-between">
                <span className="text-green-300 font-mono">Time Left:</span>
                <span className="text-green-400 font-mono">
                  {Math.max(0, Math.floor((showInfo.endTime - Date.now()) / 60000))}m
                </span>
              </div>
            )}
            {/* Status Polling Indicator */}
            
         
            {/* Show Status Details */}
            {showStatus && (
              <div className="mt-2 pt-2 border-t border-green-500/30">
  
                {showStatus.showInfo?.aliveCount !== undefined && (
                  <div className="flex justify-between">
                    <span className="text-green-300 font-mono text-xs">Alive:</span>
                    <span className="text-green-400 font-mono text-xs">{showStatus.showInfo.aliveCount}</span>
                  </div>
                )}
                {showStatus.showInfo?.winnerAgentId && (
                  <div className="flex justify-between">
                    <span className="text-green-300 font-mono text-xs">Winner:</span>
                    <span className="text-green-400 font-mono text-xs">Agent {showStatus.showInfo.winnerAgentId}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* News Button - Left Side */}
      <div className="absolute top-80 left-4 z-10">
        <button
          onClick={() => setNewsOpen(true)}
          className="bg-orange-500 hover:bg-orange-400 text-white font-bold py-4 px-8 rounded-lg border-2 border-orange-300 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-orange-500/50"
          style={{
            fontFamily: 'monospace',
            textShadow: '0 0 10px #ff8000'
          }}
        >
          NEWS
        </button>
      </div>

      {/* News Sidebar - Left Side */}
      <div className={`absolute top-1/2 left-0 transform -translate-y-1/2 bg-black/90 backdrop-blur-sm border-r-2 border-orange-500 transition-all duration-300 z-20 ${newsOpen ? 'translate-x-0 opacity-100' : '-translate-x-full opacity-0'}`} style={{ width: '350px' }}>
        <div className="p-6">
          {/* Panel Header */}
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-orange-400 font-mono text-lg">📰 SHOW NEWS</h2>
            <button
              onClick={() => setNewsOpen(false)}
              className="text-orange-400 hover:text-orange-300 font-mono text-xl"
            >
              ×
            </button>
          </div>

          {/* News Feed */}
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {currentShowNews.length > 0 ? (
              currentShowNews.map((news) => (
                <div key={news.id} className="p-3 bg-gray-800/50 border border-orange-500/30 rounded">
                  <div className="flex items-start space-x-2">
                    <div className="text-orange-400 text-sm font-mono">
                      {news.action_type === 'betrayal' && '💔'}
                      {news.action_type === 'elimination' && '💀'}
                      {news.action_type === 'alliance' && '🤝'}
                      {news.action_type === 'task' && '📋'}
                      {news.action_type === 'general' && '📢'}
                    </div>
                    <div className="flex-1">
                      <p className="text-orange-300 font-mono text-sm leading-relaxed">
                        {news.content}
                      </p>
                      <div className="text-orange-500 font-mono text-xs mt-1">
                        Agent {news.agent_id} • {new Date(news.created_at).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-orange-400 font-mono text-sm text-center py-8">
                No news updates yet...
              </div>
            )}
          </div>

          {/* Refresh Button */}
          <div className="mt-4 text-center">
            <button
              onClick={() => {
                fetchCurrentShowNews();
                console.log('Refreshing news...');
              }}
              className="bg-orange-500 hover:bg-orange-400 text-white font-bold py-2 px-4 rounded text-sm"
            >
              REFRESH NEWS
            </button>
          </div>
        </div>
      </div>

      {/* Scroll Buttons */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-10 flex space-x-4">
        {/* Left Scroll Button */}
        <button
          onClick={scrollLeft}
          disabled={scrollPosition <= 0}
          className="bg-green-500 hover:bg-green-400 disabled:bg-gray-600 disabled:cursor-not-allowed text-black font-bold w-12 h-12 rounded-full border-2 border-green-300 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-green-500/50 flex items-center justify-center"
          style={{
            fontFamily: 'monospace',
            textShadow: '0 0 10px #00ff00'
          }}
        >
          ←
        </button>

        {/* Right Scroll Button */}
        <button
          onClick={scrollRight}
          disabled={scrollPosition >= maxScroll}
          className="bg-green-500 hover:bg-green-400 disabled:bg-gray-600 disabled:cursor-not-allowed text-black font-bold w-12 h-12 rounded-full border-2 border-green-300 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-green-500/50 flex items-center justify-center"
          style={{
            fontFamily: 'monospace',
            textShadow: '0 0 10px #00ff00'
          }}
        >
          →
        </button>
      </div>

      {/* Floating Prediction Panel */}
      <div className={`absolute top-1/2 right-0 transform -translate-y-1/2 bg-black/90 backdrop-blur-sm border-l-2 border-green-500 transition-all duration-300 z-20 ${sidebarOpen ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}`} style={{ width: '350px' }}>
        <div className="p-6">
          {/* Panel Header */}
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-green-400 font-mono text-lg">PREDICTIONS</h2>
            <button
              onClick={() => setSidebarOpen(false)}
              className="text-green-400 hover:text-green-300 font-mono text-xl"
            >
              ×
            </button>
          </div>

          {/* Prediction Question */}
          <div>
            <h3 className="text-green-400 font-mono text-base mb-3">WHO WILL WIN BIG BOSS 17?</h3>
            
            {/* Winner Selection */}
            <div className="space-y-2 mb-4">
              {participants.length > 0 ? (
                participants.map((participant, index) => {
                  const voteCount = agentVoteCounts ? Number(agentVoteCounts[index]) : 0;
                  return (
                    <label key={participant.agentId} className="flex items-center justify-between cursor-pointer p-2 rounded border border-green-500/30 hover:border-green-400">
                      <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                          checked={selectedWinner === participant.agentId}
                    onChange={(e) => {
                      if (e.target.checked) {
                              setSelectedWinner(participant.agentId);
                      } else {
                        setSelectedWinner('');
                      }
                    }}
                    className="text-green-500"
                  />
                        <span className="text-green-400 font-mono text-sm">
                          {participant.name || `Agent #${participant.agentId}`}
                        </span>
                      </div>
                      <div className="text-right">
                        <div className="text-green-300 font-mono text-xs">
                          {participant.address.slice(0, 6)}...{participant.address.slice(-4)}
                        </div>
                        <div className="text-green-400 font-mono text-xs">
                          {voteCount} vote{voteCount !== 1 ? 's' : ''}
                        </div>
                        {showPredictionInfo && (
                          <div className="text-yellow-400 font-mono text-xs">
                            {showPredictionInfo.totalPrize ? `${(Number(showPredictionInfo.totalPrize) / 1e18).toFixed(2)} ETH pool` : 'No predictions yet'}
                          </div>
                        )}
                      </div>
                </label>
                  );
                })
              ) : (
                <div className="text-gray-400 font-mono text-sm text-center py-4">
                  No participants in current show
                </div>
              )}
            </div>

            {/* Contracts Input */}
            <div className="mb-4">
              <label className="block text-green-400 font-mono text-sm mb-2">CONTRACTS TO BUY:</label>
              <input
                type="number"
                min="1"
                max="100"
                value={contracts}
                onChange={(e) => setContracts(parseInt(e.target.value) || 1)}
                className="w-full bg-black border-2 border-green-500 text-green-400 font-mono px-3 py-2 rounded focus:border-green-400 focus:outline-none"
              />
            </div>

            {/* Buy Button */}
            <button
              onClick={handleBuy}
              disabled={!selectedWinner || !isConnected || !showInfo?.isActive || !currentShowId || isPending || isConfirming}
              className="w-full bg-green-500 hover:bg-green-400 disabled:bg-gray-600 disabled:cursor-not-allowed text-black font-bold py-3 px-4 rounded-lg border-2 border-green-300 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-green-500/50"
              style={{
                fontFamily: 'monospace',
                textShadow: '0 0 10px #00ff00'
              }}
            >
              {isPending ? 'PLACING PREDICTION...' : isConfirming ? 'CONFIRMING...' : `BUY ${contracts} CONTRACT${contracts > 1 ? 'S' : ''} (${(0.01 * contracts).toFixed(2)} ETH)`}
            </button>
            
            {/* Prediction Info */}
            <div className="mt-2 text-xs text-green-300 font-mono text-center">
              {!isConnected && 'Connect wallet to predict'}
              {isConnected && (!showInfo?.isActive || !currentShowId) && 'No active show available'}
              {isConnected && showInfo?.isActive && currentShowId && participants.length === 0 && 'No participants yet'}
              {isConnected && showInfo?.isActive && currentShowId && participants.length > 0 && !selectedWinner && 'Select an agent to predict'}
              {isConnected && showInfo?.isActive && currentShowId && participants.length > 0 && selectedWinner && 'Ready to predict on current show!'}
            </div>
          </div>
        </div>
      </div>

      {/* Floating Voting Panel */}
      <div className={`absolute top-1/2 right-0 transform -translate-y-1/2 bg-black/90 backdrop-blur-sm border-l-2 border-blue-500 transition-all duration-300 z-20 ${votingOpen ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}`} style={{ width: '350px' }}>
        <div className="p-6">
          {/* Panel Header */}
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-blue-400 font-mono text-lg">VOTING</h2>
            <button
              onClick={() => setVotingOpen(false)}
              className="text-blue-400 hover:text-blue-300 font-mono text-xl"
            >
              ×
            </button>
          </div>

          {/* Voting Question */}
          <div>
            <h3 className="text-blue-400 font-mono text-base mb-3">VOTE FOR YOUR FAVORITE</h3>
            
            {/* Contestant Selection */}
            <div className="space-y-2 mb-4">
              {participants.length > 0 ? (
                participants.map((participant) => (
                  <label key={participant.agentId} className="flex items-center justify-between cursor-pointer p-2 rounded border border-blue-500/30 hover:border-blue-400">
                    <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name="vote"
                        checked={selectedVote === participant.agentId}
                    onChange={(e) => {
                      if (e.target.checked) {
                            setSelectedVote(participant.agentId);
                      }
                    }}
                    className="text-blue-500"
                  />
                      <span className="text-blue-400 font-mono text-sm">
                        {participant.name || `Agent #${participant.agentId}`}
                      </span>
                    </div>
                    <span className="text-blue-300 font-mono text-xs">
                      {participant.address.slice(0, 6)}...{participant.address.slice(-4)}
                    </span>
                </label>
                ))
              ) : (
                <div className="text-gray-400 font-mono text-sm text-center py-4">
                  No participants in current show
                </div>
              )}
            </div>

            {/* Vote Button */}
            <button
              onClick={handleVote}
              disabled={!selectedVote || !isConnected || !showInfo?.isActive || isPending || isConfirming}
              className="w-full bg-blue-500 hover:bg-blue-400 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg border-2 border-blue-300 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-blue-500/50"
              style={{
                fontFamily: 'monospace',
                textShadow: '0 0 10px #0066ff'
              }}
            >
              {isPending ? 'CASTING VOTE...' : isConfirming ? 'CONFIRMING...' : `CAST VOTE (0.01 ETH)`}
            </button>
            
            {/* Vote Info */}
            <div className="mt-2 text-xs text-blue-300 font-mono text-center">
              {!isConnected && 'Connect wallet to vote'}
              {isConnected && !showInfo?.isActive && 'No active show'}
              {isConnected && showInfo?.isActive && participants.length === 0 && 'No participants yet'}
              {isConnected && showInfo?.isActive && participants.length > 0 && !selectedVote && 'Select an agent to vote'}
            </div>
          </div>
        </div>
      </div>

      {/* Character Info Panel */}
      <div className={`absolute top-1/2 right-0 transform -translate-y-1/2 bg-black/90 backdrop-blur-sm border-l-2 border-purple-500 transition-all duration-300 z-20 ${characterInfoOpen ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}`} style={{ width: '350px' }}>
        <div className="p-6">
          {/* Panel Header */}
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-purple-400 font-mono text-lg">CHARACTER INFO</h2>
            <button
              onClick={() => setCharacterInfoOpen(false)}
              className="text-purple-400 hover:text-purple-300 font-mono text-xl"
            >
              ×
            </button>
          </div>

          {/* Character Details */}
          {selectedCharacter && (
            <div>
              <div className="text-center mb-4">
                <div className="w-20 h-20 mx-auto mb-3 bg-purple-900 rounded-full flex items-center justify-center">
                  <span className="text-purple-400 font-mono text-2xl font-bold">
                    {selectedCharacter.name.charAt(selectedCharacter.name.length - 1)}
                  </span>
                </div>
                <h3 className="text-purple-400 font-mono text-xl font-bold">{selectedCharacter.name}</h3>
                <p className="text-purple-300 font-mono text-sm">{selectedCharacter.personality}</p>
              </div>

              {/* Stats */}
              <div className="space-y-3 mb-4">
                {selectedCharacter.loadingTraits ? (
                  <div className="text-center text-purple-400 font-mono text-sm">
                    Loading real agent traits...
                  </div>
                ) : selectedCharacter.traits ? (
                  <>
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-purple-400 font-mono text-sm">POPULARITY</span>
                        <span className="text-purple-300 font-mono text-sm">{selectedCharacter.traits.popularity}/100</span>
                      </div>
                      <div className="w-full bg-purple-900 rounded-full h-2">
                        <div 
                          className="bg-purple-500 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${selectedCharacter.traits.popularity}%` }}
                        ></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-purple-400 font-mono text-sm">AGGRESSION</span>
                        <span className="text-purple-300 font-mono text-sm">{selectedCharacter.traits.aggression}/100</span>
                      </div>
                      <div className="w-full bg-purple-900 rounded-full h-2">
                        <div 
                          className="bg-red-500 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${selectedCharacter.traits.aggression}%` }}
                        ></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-purple-400 font-mono text-sm">LOYALTY</span>
                        <span className="text-purple-300 font-mono text-sm">{selectedCharacter.traits.loyalty}/100</span>
                      </div>
                      <div className="w-full bg-purple-900 rounded-full h-2">
                        <div 
                          className="bg-green-500 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${selectedCharacter.traits.loyalty}%` }}
                        ></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-purple-400 font-mono text-sm">RESILIENCE</span>
                        <span className="text-purple-300 font-mono text-sm">{selectedCharacter.traits.resilience}/100</span>
                      </div>
                      <div className="w-full bg-purple-900 rounded-full h-2">
                        <div 
                          className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${selectedCharacter.traits.resilience}%` }}
                        ></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-purple-400 font-mono text-sm">CHARISMA</span>
                        <span className="text-purple-300 font-mono text-sm">{selectedCharacter.traits.charisma}/100</span>
                      </div>
                      <div className="w-full bg-purple-900 rounded-full h-2">
                        <div 
                          className="bg-yellow-500 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${selectedCharacter.traits.charisma}%` }}
                        ></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-purple-400 font-mono text-sm">SUSPICION</span>
                        <span className="text-purple-300 font-mono text-sm">{selectedCharacter.traits.suspicion}/100</span>
                      </div>
                      <div className="w-full bg-purple-900 rounded-full h-2">
                        <div 
                          className="bg-orange-500 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${selectedCharacter.traits.suspicion}%` }}
                        ></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-purple-400 font-mono text-sm">ENERGY</span>
                        <span className="text-purple-300 font-mono text-sm">{selectedCharacter.traits.energy}/100</span>
                      </div>
                      <div className="w-full bg-purple-900 rounded-full h-2">
                        <div 
                          className="bg-cyan-500 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${selectedCharacter.traits.energy}%` }}
                        ></div>
                      </div>
                    </div>

                    <div className="mt-3 p-2 bg-purple-900/30 border border-purple-500/30 rounded">
                      <div className="text-center">
                        <span className="text-purple-400 font-mono text-sm">RISK SCORE</span>
                        <div className="text-purple-300 font-mono text-lg font-bold">
                          {selectedCharacter.traits.riskScore > 0 ? '+' : ''}{selectedCharacter.traits.riskScore}
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-purple-400 font-mono text-sm">STRENGTH</span>
                        <span className="text-purple-300 font-mono text-sm">{selectedCharacter.strength}/10</span>
                      </div>
                      <div className="w-full bg-purple-900 rounded-full h-2">
                        <div 
                          className="bg-purple-500 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${(selectedCharacter.strength / 10) * 100}%` }}
                        ></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-purple-400 font-mono text-sm">INTELLIGENCE</span>
                        <span className="text-purple-300 font-mono text-sm">{selectedCharacter.intelligence}/10</span>
                      </div>
                      <div className="w-full bg-purple-900 rounded-full h-2">
                        <div 
                          className="bg-purple-500 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${(selectedCharacter.intelligence / 10) * 100}%` }}
                        ></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-purple-400 font-mono text-sm">CHARISMA</span>
                        <span className="text-purple-300 font-mono text-sm">{selectedCharacter.charisma}/10</span>
                      </div>
                      <div className="w-full bg-purple-900 rounded-full h-2">
                        <div 
                          className="bg-purple-500 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${(selectedCharacter.charisma / 10) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Description */}
              <div className="mb-4">
                <h4 className="text-purple-400 font-mono text-sm mb-2">DESCRIPTION</h4>
                <p className="text-purple-300 font-mono text-xs leading-relaxed">
                  {selectedCharacter.description}
                </p>
              </div>

              {/* Agent News Section */}
              {selectedCharacter.participant && (
                <div className="mb-4">
                  <h4 className="text-purple-400 font-mono text-sm mb-2">📰 AGENT NEWS</h4>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {agentNews.length > 0 ? (
                      agentNews.map((news) => (
                        <div key={news.id} className="p-2 bg-purple-900/30 border border-purple-500/30 rounded text-xs">
                          <div className="flex items-start space-x-2">
                            <div className="text-purple-400 text-xs">
                              {news.action_type === 'betrayal' && '💔'}
                              {news.action_type === 'elimination' && '💀'}
                              {news.action_type === 'alliance' && '🤝'}
                              {news.action_type === 'task' && '📋'}
                              {news.action_type === 'general' && '📢'}
                            </div>
                            <div className="flex-1">
                              <p className="text-purple-300 font-mono text-xs leading-relaxed">
                                {news.content}
                              </p>
                              <div className="text-purple-500 font-mono text-xs mt-1">
                                {new Date(news.created_at).toLocaleTimeString()}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-purple-400 font-mono text-xs text-center py-2">
                        No news for this agent yet...
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* User Input Box */}
              <div className="mb-4">
                <h4 className="text-purple-400 font-mono text-sm mb-2">USER INPUT</h4>
                <input
                  type="text"
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  placeholder="Enter your message about this character..."
                  className="w-full bg-black/90 border-2 border-purple-500 text-purple-400 font-mono px-3 py-2 rounded focus:border-purple-400 focus:outline-none placeholder-purple-500/50"
                />
                {isConnected && (
                  <div className="mt-1 text-xs text-purple-300 font-mono text-center">
                    From: {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'Unknown'}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="space-y-2">
                <button
                  onClick={() => {
                    if (selectedCharacter.participant) {
                      setSelectedWinner(selectedCharacter.participant.agentId);
                    }
                    setCharacterInfoOpen(false);
                    setSidebarOpen(true);
                  }}
                  disabled={!selectedCharacter.participant}
                  className="w-full bg-green-500 hover:bg-green-400 disabled:bg-gray-600 disabled:cursor-not-allowed text-black font-bold py-2 px-4 rounded-lg border-2 border-green-300 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-green-500/50"
                  style={{
                    fontFamily: 'monospace',
                    textShadow: '0 0 10px #00ff00'
                  }}
                >
                  {selectedCharacter.participant ? 'PREDICT WINNER' : 'NO PARTICIPANT DATA'}
                </button>
                
                <button
                  onClick={() => {
                    if (selectedCharacter.participant) {
                      setSelectedVote(selectedCharacter.participant.agentId);
                    }
                    setCharacterInfoOpen(false);
                    setVotingOpen(true);
                  }}
                  disabled={!selectedCharacter.participant}
                  className="w-full bg-blue-500 hover:bg-blue-400 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-2 px-4 rounded-lg border-2 border-blue-300 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-blue-500/50"
                  style={{
                    fontFamily: 'monospace',
                    textShadow: '0 0 10px #0066ff'
                  }}
                >
                  {selectedCharacter.participant ? 'VOTE FOR THIS CONTESTANT' : 'NO PARTICIPANT DATA'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Sidebar Toggle Buttons */}
      <div className="absolute top-4 right-4 flex flex-col space-y-2 z-10">
        <button
          onClick={() => setSidebarOpen(true)}
          className="bg-green-500 hover:bg-green-400 text-black font-bold py-2 px-4 rounded-lg border-2 border-green-300 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-green-500/50"
          style={{
            fontFamily: 'monospace',
            textShadow: '0 0 10px #00ff00'
          }}
        >
          PREDICTIONS
        </button>
        
        <button
          onClick={() => setVotingOpen(true)}
          className="bg-blue-500 hover:bg-blue-400 text-white font-bold py-2 px-4 rounded-lg border-2 border-blue-300 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-blue-500/50"
          style={{
            fontFamily: 'monospace',
            textShadow: '0 0 10px #0066ff'
          }}
        >
          VOTING
        </button>

        <button
          onClick={() => router.push('/nextshow')}
          className="bg-purple-500 hover:bg-purple-400 text-white font-bold py-2 px-4 rounded-lg border-2 border-purple-300 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-purple-500/50"
          style={{
            fontFamily: 'monospace',
            textShadow: '0 0 10px #8000ff'
          }}
        >
          NEXT SHOW
        </button>

        {/* Test Popup Buttons */}
        <button
          onClick={triggerEventPopup}
          className="bg-orange-500 hover:bg-orange-400 text-white font-bold py-2 px-4 rounded-lg border-2 border-orange-300 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-orange-500/50"
          style={{
            fontFamily: 'monospace',
            textShadow: '0 0 10px #ff8000'
          }}
        >
          TEST EVENT
        </button>
        
        <button
          onClick={triggerWinnerPopup}
          className="bg-yellow-500 hover:bg-yellow-400 text-black font-bold py-2 px-4 rounded-lg border-2 border-yellow-300 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-yellow-500/50"
          style={{
            fontFamily: 'monospace',
            textShadow: '0 0 10px #FFD700'
          }}
        >
          TEST WINNER
        </button>

        <button
          onClick={() => router.push('/verify')}
          className="bg-indigo-500 hover:bg-indigo-400 text-white font-bold py-2 px-4 rounded-lg border-2 border-indigo-300 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-indigo-500/50"
          style={{
            fontFamily: 'monospace',
            textShadow: '0 0 10px #6366f1'
          }}
        >
          SELF VERIFY
        </button>
      </div>

      {/* Popup Components */}
      <EventPopup 
        isOpen={eventPopupOpen}
        onClose={() => setEventPopupOpen(false)}
        eventData={currentEventData}
      />
      
      <WinnerPopup 
        isOpen={winnerPopupOpen}
        onClose={() => setWinnerPopupOpen(false)}
        winnerData={currentWinnerData}
      />

    </div>
  );
}
