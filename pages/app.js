import WalletConnect from '../components/WalletConnect';
import Character from '../components/Character';
import { useState, useEffect } from 'react';

export default function App() {
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


  const handleBuy = () => {
    if (!selectedWinner) {
      alert('Please select a winner first!');
      return;
    }
    console.log(`Buying ${contracts} contracts for ${selectedWinner}`);
    alert(`Successfully bought ${contracts} contracts for ${selectedWinner}!`);
  };

  const handleVote = () => {
    if (!selectedVote) {
      alert('Please select a contestant to vote for!');
      return;
    }
    console.log(`Voting for ${selectedVote}`);
    alert(`Successfully voted for ${selectedVote}!`);
  };

  const handleCharacterClick = (characterData) => {
    setSelectedCharacter(characterData);
    setCharacterInfoOpen(true);
  };
  
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
      
      {/* Character - Positioned relative to the image container */}
      {imageWidth > 0 && imageHeight > 0 && (
        <div 
          className="absolute top-0 left-0"
          style={{
            width: `${imageWidth}px`,
            height: `${imageHeight}px`,
            transform: `translateX(-${scrollPosition}px)`,
          }}
        >
          <Character 
            roomWidth={imageWidth}
            roomHeight={imageHeight}
            imageWidth={imageWidth}
            imageHeight={imageHeight}
            onCharacterClick={handleCharacterClick}
          />
        </div>
      )}

      {/* Wallet Connect Button - Top Right */}
      <div className="absolute top-4 right-4 z-10">
        <WalletConnect />
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
              {['Contestant A', 'Contestant B', 'Contestant C', 'Contestant D'].map((contestant) => (
                <label key={contestant} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedWinner === contestant}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedWinner(contestant);
                      } else {
                        setSelectedWinner('');
                      }
                    }}
                    className="text-green-500"
                  />
                  <span className="text-green-400 font-mono text-sm">{contestant}</span>
                </label>
              ))}
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
              className="w-full bg-green-500 hover:bg-green-400 text-black font-bold py-3 px-4 rounded-lg border-2 border-green-300 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-green-500/50"
              style={{
                fontFamily: 'monospace',
                textShadow: '0 0 10px #00ff00'
              }}
            >
              BUY CONTRACTS
            </button>
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
              {['Contestant A', 'Contestant B'].map((contestant) => (
                <label key={contestant} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name="vote"
                    checked={selectedVote === contestant}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedVote(contestant);
                      }
                    }}
                    className="text-blue-500"
                  />
                  <span className="text-blue-400 font-mono text-sm">{contestant}</span>
                </label>
              ))}
            </div>

            {/* Vote Button */}
            <button
              onClick={handleVote}
              className="w-full bg-blue-500 hover:bg-blue-400 text-white font-bold py-3 px-4 rounded-lg border-2 border-blue-300 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-blue-500/50"
              style={{
                fontFamily: 'monospace',
                textShadow: '0 0 10px #0066ff'
              }}
            >
              CAST VOTE
            </button>
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
              </div>

              {/* Description */}
              <div className="mb-4">
                <h4 className="text-purple-400 font-mono text-sm mb-2">DESCRIPTION</h4>
                <p className="text-purple-300 font-mono text-xs leading-relaxed">
                  {selectedCharacter.description}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2">
                <button
                  onClick={() => {
                    setSelectedWinner(selectedCharacter.name);
                    setCharacterInfoOpen(false);
                    setSidebarOpen(true);
                  }}
                  className="w-full bg-green-500 hover:bg-green-400 text-black font-bold py-2 px-4 rounded-lg border-2 border-green-300 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-green-500/50"
                  style={{
                    fontFamily: 'monospace',
                    textShadow: '0 0 10px #00ff00'
                  }}
                >
                  PREDICT WINNER
                </button>
                
                <button
                  onClick={() => {
                    setSelectedVote(selectedCharacter.name);
                    setCharacterInfoOpen(false);
                    setVotingOpen(true);
                  }}
                  className="w-full bg-blue-500 hover:bg-blue-400 text-white font-bold py-2 px-4 rounded-lg border-2 border-blue-300 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-blue-500/50"
                  style={{
                    fontFamily: 'monospace',
                    textShadow: '0 0 10px #0066ff'
                  }}
                >
                  VOTE FOR THIS CONTESTANT
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Sidebar Toggle Buttons */}
      <div className="absolute top-4 left-4 flex flex-col space-y-2 z-10">
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
      </div>

    </div>
  );
}
