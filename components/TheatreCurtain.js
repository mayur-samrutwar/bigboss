import { useState, useEffect } from 'react';

const TheatreCurtain = ({ children, autoOpen = true, delay = 1000 }) => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (autoOpen) {
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, delay);
      return () => clearTimeout(timer);
    }
  }, [autoOpen, delay]);

  const handleOpen = () => {
    setIsOpen(true);
  };

  return (
    <div className="relative w-full h-screen overflow-hidden bg-gradient-to-b from-gray-900 via-red-900 to-black">
      {/* Theatre Stage Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-amber-100 via-amber-200 to-amber-300 opacity-20"></div>
      
      {/* Left Curtain */}
      <div 
        className={`absolute top-0 left-0 w-1/2 h-full bg-gradient-to-r from-red-800 via-red-700 to-red-600 
          transform origin-left transition-transform duration-2000 ease-in-out z-20 curtain-left
          ${isOpen ? '-translate-x-full' : 'translate-x-0'}
          shadow-2xl`}
        style={{
          background: 'linear-gradient(135deg, #7f1d1d 0%, #991b1b 25%, #dc2626 50%, #b91c1c 75%, #7f1d1d 100%)',
          boxShadow: 'inset -10px 0 20px rgba(0,0,0,0.3), 10px 0 30px rgba(0,0,0,0.5)'
        }}
      >
        {/* Curtain Folds */}
        <div className="absolute inset-0 curtain-folds">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="absolute w-full h-1/8 bg-gradient-to-r from-red-900 to-red-600 opacity-60"
              style={{
                top: `${i * 12.5}%`,
                height: '12.5%',
                background: `linear-gradient(90deg, 
                  rgba(127, 29, 29, 0.8) 0%, 
                  rgba(185, 28, 28, 0.6) 50%, 
                  rgba(220, 38, 38, 0.4) 100%)`,
                boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.3)',
                animationDelay: `${i * 0.1}s`
              }}
            />
          ))}
        </div>
        
        {/* Curtain Tassels */}
        <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-2 h-32 bg-gradient-to-b from-yellow-400 to-yellow-600 rounded-full opacity-80"></div>
        <div className="absolute right-0 top-1/3 transform -translate-y-1/2 w-2 h-24 bg-gradient-to-b from-yellow-400 to-yellow-600 rounded-full opacity-70"></div>
        <div className="absolute right-0 top-2/3 transform -translate-y-1/2 w-2 h-24 bg-gradient-to-b from-yellow-400 to-yellow-600 rounded-full opacity-70"></div>
      </div>

      {/* Right Curtain */}
      <div 
        className={`absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-red-800 via-red-700 to-red-600 
          transform origin-right transition-transform duration-2000 ease-in-out z-20 curtain-right
          ${isOpen ? 'translate-x-full' : 'translate-x-0'}
          shadow-2xl`}
        style={{
          background: 'linear-gradient(225deg, #7f1d1d 0%, #991b1b 25%, #dc2626 50%, #b91c1c 75%, #7f1d1d 100%)',
          boxShadow: 'inset 10px 0 20px rgba(0,0,0,0.3), -10px 0 30px rgba(0,0,0,0.5)'
        }}
      >
        {/* Curtain Folds */}
        <div className="absolute inset-0 curtain-folds">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="absolute w-full h-1/8 bg-gradient-to-l from-red-900 to-red-600 opacity-60"
              style={{
                top: `${i * 12.5}%`,
                height: '12.5%',
                background: `linear-gradient(270deg, 
                  rgba(127, 29, 29, 0.8) 0%, 
                  rgba(185, 28, 28, 0.6) 50%, 
                  rgba(220, 38, 38, 0.4) 100%)`,
                boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.3)',
                animationDelay: `${i * 0.1}s`
              }}
            />
          ))}
        </div>
        
        {/* Curtain Tassels */}
        <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-2 h-32 bg-gradient-to-b from-yellow-400 to-yellow-600 rounded-full opacity-80"></div>
        <div className="absolute left-0 top-1/3 transform -translate-y-1/2 w-2 h-24 bg-gradient-to-b from-yellow-400 to-yellow-600 rounded-full opacity-70"></div>
        <div className="absolute left-0 top-2/3 transform -translate-y-1/2 w-2 h-24 bg-gradient-to-b from-yellow-400 to-yellow-600 rounded-full opacity-70"></div>
      </div>

      {/* Theatre Stage Floor */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-amber-800 via-amber-700 to-amber-600 opacity-90 z-10 stage-glow">
        <div className="absolute inset-0 bg-gradient-to-t from-transparent via-amber-900/20 to-transparent"></div>
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-yellow-400 to-transparent opacity-60"></div>
      </div>

      {/* Content Area */}
      <div className={`absolute inset-0 z-30 flex items-center justify-center transition-opacity duration-1000 ${isOpen ? 'opacity-100' : 'opacity-0'}`}>
        <div className="text-center text-white">
          {children}
        </div>
      </div>

      {/* Manual Open Button (if autoOpen is false) */}
      {!autoOpen && (
        <button
          onClick={handleOpen}
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-40 bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-full font-semibold transition-colors duration-300 shadow-lg"
        >
          Open Curtain
        </button>
      )}

      {/* Theatre Lights Effect */}
      <div className="absolute top-0 left-0 right-0 h-20 bg-gradient-to-b from-yellow-200/30 to-transparent z-10"></div>
    </div>
  );
};

export default TheatreCurtain;
