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
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Popup Content */}
      <div 
        className={`relative bg-black/95 border border-orange-500 rounded-lg p-6 max-w-lg mx-4 transform transition-all duration-300 ${
          isVisible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
        }`}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-orange-400 hover:text-orange-300 font-mono text-xl transition-colors"
        >
          ×
        </button>

        {/* Header */}
        <div className="text-center mb-4">
          <div className="text-orange-400 font-mono text-xl font-bold mb-2">
            BIG BOSS ANNOUNCEMENT
          </div>
        </div>

        {/* Event Content */}
        <div className="text-center mb-6">
          <div className="text-orange-300 font-mono text-base leading-relaxed">
            {eventData?.content || "This thing happened"}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center">
          <button
            onClick={onClose}
            className="bg-orange-500 hover:bg-orange-400 text-black font-bold py-2 px-6 rounded transition-colors"
            style={{
              fontFamily: 'monospace'
            }}
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
};

export default EventPopup;
