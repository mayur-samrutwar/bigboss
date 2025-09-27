import { useState, useEffect } from 'react';

const CRTMonitor = ({ children, onEnter }) => {
  const [isFlashing, setIsFlashing] = useState(false);
  const [showBlank, setShowBlank] = useState(false);
  const [noiseParticles, setNoiseParticles] = useState([]);

  // Generate dense noise particles
  useEffect(() => {
    const generateNoise = () => {
      const particles = [];
      for (let i = 0; i < 800; i++) {
        particles.push({
          id: i,
          x: Math.random() * 100,
          y: Math.random() * 100,
          size: Math.random() * 2 + 0.5,
          opacity: Math.random() * 0.9 + 0.1,
          speed: Math.random() * 0.3 + 0.05
        });
      }
      setNoiseParticles(particles);
    };

    generateNoise();
    const interval = setInterval(generateNoise, 50);
    return () => clearInterval(interval);
  }, []);

  const handleEnter = () => {
    setIsFlashing(true);
    setTimeout(() => {
      setIsFlashing(false);
      setShowBlank(true);
      if (onEnter) onEnter();
    }, 500);
  };

  return (
    <div className="relative w-full h-screen bg-black">
      {/* CRT Monitor Screen - Full Screen */}
      <div className="relative w-full h-full bg-black overflow-hidden crt-screen">
        {/* CRT Scanlines - Hidden after flash */}
        {!showBlank && <div className="absolute inset-0 scanlines"></div>}
        
        {/* Heavy Noise Texture - Hidden after flash */}
        {!showBlank && <div className="absolute inset-0 noise"></div>}

        {/* Dense Noise Particles - Hidden after flash */}
        {!showBlank && (
          <div className="absolute inset-0 pointer-events-none">
            {noiseParticles.map((particle) => (
              <div
                key={particle.id}
                className="absolute bg-white"
                style={{
                  left: `${particle.x}%`,
                  top: `${particle.y}%`,
                  width: `${particle.size}px`,
                  height: `${particle.size}px`,
                  opacity: particle.opacity,
                  animation: `noise ${particle.speed}s linear infinite`
                }}
              />
            ))}
          </div>
        )}

        {/* TV Flash Effect */}
        {isFlashing && (
          <div className="absolute inset-0 bg-white animate-ping z-50"></div>
        )}

        {/* Content Area */}
        <div className={`relative z-10 w-full h-full flex items-center justify-center transition-opacity duration-500 ${showBlank ? 'opacity-0' : 'opacity-100'}`}>
          {!showBlank ? (
            <div className="text-center">
              {/* Welcome Text */}
              <div className="text-green-400 font-mono text-3xl mb-8 animate-pulse">
                WELCOME TO BIGBOSS
              </div>
              
              {/* Enter Button */}
              <button
                onClick={handleEnter}
                className="bg-green-500 hover:bg-green-400 text-black font-bold py-4 px-8 rounded-lg border-2 border-green-300 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-green-500/50 crt-button"
                style={{
                  fontFamily: 'monospace',
                  textShadow: '0 0 10px #00ff00'
                }}
              >
                ENTER NOW
              </button>
            </div>
          ) : null}
        </div>

        {/* Screen Flicker Effect - Hidden after flash */}
        {!showBlank && (
          <div className="absolute inset-0 pointer-events-none">
            <div 
              className="w-full h-full bg-black opacity-0"
              style={{
                animation: 'screenFlicker 0.1s linear infinite'
              }}
            />
          </div>
        )}
      </div>

      {/* CRT Monitor Bezel - At edges of screen - Hidden after flash */}
      {!showBlank && (
        <div className="absolute inset-0 pointer-events-none">
          {/* Top Bezel */}
          <div className="absolute top-0 left-0 right-0 h-8 bg-gradient-to-b from-gray-800 to-gray-900"></div>
          {/* Bottom Bezel */}
          <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-gray-800 to-gray-900"></div>
          {/* Left Bezel */}
          <div className="absolute top-0 bottom-0 left-0 w-8 bg-gradient-to-r from-gray-800 to-gray-900"></div>
          {/* Right Bezel */}
          <div className="absolute top-0 bottom-0 right-0 w-8 bg-gradient-to-l from-gray-800 to-gray-900"></div>
        </div>
      )}

      {/* Custom CSS for animations */}
      <style jsx>{`
        @keyframes scanline {
          0% { transform: translateY(-100vh); }
          100% { transform: translateY(100vh); }
        }
        
        @keyframes noise {
          0% { transform: translate(0, 0); }
          25% { transform: translate(-2px, -2px); }
          50% { transform: translate(2px, -2px); }
          75% { transform: translate(-2px, 2px); }
          100% { transform: translate(2px, 2px); }
        }
        
        @keyframes screenFlicker {
          0%, 100% { opacity: 0; }
          50% { opacity: 0.05; }
        }
      `}</style>
    </div>
  );
};

export default CRTMonitor;
