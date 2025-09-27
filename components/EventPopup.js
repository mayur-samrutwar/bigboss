import { useState, useEffect } from 'react';

const EventPopup = ({ isOpen, onClose, eventData }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Popup Content */}
      <div 
        className={`relative bg-gradient-to-br from-orange-900/95 to-red-900/95 border-2 border-orange-400 rounded-2xl p-8 max-w-md mx-4 transform transition-all duration-500 ${
          isVisible ? 'scale-100 opacity-100' : 'scale-75 opacity-0'
        }`}
        style={{
          boxShadow: '0 0 50px rgba(255, 140, 0, 0.5), inset 0 0 20px rgba(255, 140, 0, 0.1)'
        }}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-orange-400 hover:text-orange-300 font-mono text-2xl transition-colors"
        >
          ×
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <div className="text-orange-400 font-mono text-3xl font-bold mb-2 tracking-wider">
            🎭 BIG BOSS ANNOUNCEMENT
          </div>
          <div className="w-full h-1 bg-gradient-to-r from-orange-500 to-red-500 rounded-full"></div>
        </div>

        {/* Event Content */}
        <div className="text-center">
          <div className="bg-black/40 border border-orange-500/50 rounded-lg p-6 mb-4">
            <div className="text-orange-300 font-mono text-lg leading-relaxed">
              {eventData?.content || "This thing happened"}
            </div>
          </div>
          
          {/* Decorative Elements */}
          <div className="flex justify-center space-x-2 mb-4">
            <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse"></div>
            <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
            <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center">
          <button
            onClick={onClose}
            className="bg-orange-500 hover:bg-orange-400 text-black font-bold py-3 px-8 rounded-lg border-2 border-orange-300 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-orange-500/50"
            style={{
              fontFamily: 'monospace',
              textShadow: '0 0 10px #ff8000'
            }}
          >
            ACKNOWLEDGE
          </button>
        </div>
      </div>
    </div>
  );
};

export default EventPopup;
