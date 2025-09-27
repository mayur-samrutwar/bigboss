import { useState } from 'react';
import { useRouter } from 'next/router';
import WalletConnect from '../components/WalletConnect';

export default function Home() {
  const router = useRouter();

  const handleEnter = () => {
    router.push('/app');
  };

  return (
    <div className="relative w-full h-screen bg-black">
      {/* CRT Monitor Screen - Full Screen */}
      <div className="relative w-full h-full bg-black overflow-hidden crt-screen">
        {/* CRT Scanlines */}
        <div className="absolute inset-0 scanlines"></div>
        
        {/* Heavy Noise Texture */}
        <div className="absolute inset-0 noise"></div>

        {/* Dense Noise Particles */}
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(800)].map((_, i) => (
            <div
              key={i}
              className="absolute bg-white"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                width: `${Math.random() * 2 + 0.5}px`,
                height: `${Math.random() * 2 + 0.5}px`,
                opacity: Math.random() * 0.9 + 0.1,
                animation: `noise ${Math.random() * 0.3 + 0.05}s linear infinite`
              }}
            />
          ))}
        </div>

        {/* Salman Khan Stickers - Near Title */}
        <div className="absolute inset-0 pointer-events-none z-20">
          {/* Salman 1 - Left of Title */}
          <div 
            className="absolute"
            style={{
              top: '35%',
              left: '15%',
              animation: 'wobble 2s ease-in-out infinite',
              animationDelay: '0s'
            }}
          >
            <img 
              src="/salman1.png" 
              alt="Salman Khan" 
              className="w-48 h-auto opacity-90 hover:opacity-100 transition-opacity duration-300"
            />
          </div>
          
          {/* Salman 2 - Right of Title */}
          <div 
            className="absolute"
            style={{
              top: '35%',
              right: '15%',
              animation: 'wobble 2.5s ease-in-out infinite',
              animationDelay: '1s'
            }}
          >
            <img 
              src="/salman2.png" 
              alt="Salman Khan" 
              className="w-44 h-auto opacity-90 hover:opacity-100 transition-opacity duration-300"
            />
          </div>
        </div>

        {/* Content Area */}
        <div className="relative z-10 w-full h-full flex items-center justify-center">
          <div className="text-center">
            {/* Welcome Text */}
            <div className="text-green-400 font-mono text-3xl mb-8 animate-pulse">
              WELCOME TO BIGBOSS
            </div>
            
            {/* Wallet Connect Button */}
            <div className="mb-6">
              <WalletConnect />
            </div>
            
            {/* Button Container */}
            <div className="flex flex-col sm:flex-row gap-6 items-center justify-center">
              {/* Enter Room Button */}
              <button
                onClick={handleEnter}
                className="bg-green-500 hover:bg-green-400 text-black font-bold py-4 px-8 rounded-lg border-2 border-green-300 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-green-500/50 crt-button"
                style={{
                  fontFamily: 'monospace',
                  textShadow: '0 0 10px #00ff00'
                }}
              >
                ENTER SHOW
              </button>

              {/* Participate in Next Button */}
              <button
                onClick={() => router.push('/register')}
                className="bg-blue-500 hover:bg-blue-400 text-white font-bold py-4 px-8 rounded-lg border-2 border-blue-300 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-blue-500/50"
                style={{
                  fontFamily: 'monospace',
                  textShadow: '0 0 10px #0066ff'
                }}
              >
                PARTICIPATE IN NEXT
              </button>

            </div>
          </div>
        </div>

        {/* Screen Flicker Effect */}
        <div className="absolute inset-0 pointer-events-none">
          <div 
            className="w-full h-full bg-black opacity-0"
            style={{
              animation: 'screenFlicker 0.1s linear infinite'
            }}
          />
        </div>
      </div>

      {/* CRT Monitor Bezel - At edges of screen */}
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
        
        @keyframes wobble {
          0%, 100% { transform: rotate(0deg); }
          25% { transform: rotate(2deg); }
          75% { transform: rotate(-2deg); }
        }
      `}</style>
    </div>
  );
}
