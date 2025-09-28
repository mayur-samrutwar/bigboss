import { useState, useEffect } from 'react';

const Character = ({ roomWidth, roomHeight, imageWidth, imageHeight, onCharacterClick, participant, index }) => {
  // Character sprite sheet info
  const spriteSize = 576; // 576x576 per character
  const frameSize = 144; // 576/4 = 144px per frame
  const directions = ['down', 'left', 'right', 'up'];
  const directionMap = {
    down: 0,   // Row 1
    left: 1,   // Row 2  
    right: 2,  // Row 3
    up: 3      // Row 4
  };

  // Character selection based on participant or random for placeholders
  const [characterId] = useState(() => {
    return participant ? 
      (parseInt(participant.agentId) % 11) + 1 : // Use agent ID to determine character
      Math.floor(Math.random() * 11) + 1; // Random for placeholders
  });

  // Initial position based on index to spread characters
  const [initialPosition] = useState(() => {
    const initialX = participant ? 
      (index * 200 + 100) % (imageWidth - frameSize) : // Spread participants
      Math.floor(Math.random() * (imageWidth - frameSize)); // Random for placeholders
    const initialY = participant ?
      (index * 150 + 100) % (imageHeight - frameSize) : // Spread participants
      Math.floor(Math.random() * (imageHeight - frameSize)); // Random for placeholders
    
    return { x: initialX, y: initialY };
  });

  const [position, setPosition] = useState(initialPosition);
  const [direction, setDirection] = useState(directions[Math.floor(Math.random() * directions.length)]);
  const [animationFrame, setAnimationFrame] = useState(0);
  const [isMoving, setIsMoving] = useState(true);
  const [agentTraits, setAgentTraits] = useState(null);
  const [loadingTraits, setLoadingTraits] = useState(false);

  // Fetch real agent traits when participant is available
  useEffect(() => {
    if (participant && participant.agentId) {
      setLoadingTraits(true);
      fetch(`/api/traits/getAgentTraits?agentId=${participant.agentId}`)
        .then(response => response.json())
        .then(data => {
          if (data.success) {
            setAgentTraits(data.traits);
          } else {
            console.error('Failed to fetch agent traits:', data.error);
            setAgentTraits(null);
          }
        })
        .catch(error => {
          console.error('Error fetching agent traits:', error);
          setAgentTraits(null);
        })
        .finally(() => {
          setLoadingTraits(false);
        });
    }
  }, [participant]);

  // Character data with real traits when available
  const characterData = {
    id: characterId,
    name: participant ? (participant.name || `Agent #${participant.agentId}`) : `Contestant ${String.fromCharCode(64 + characterId)}`,
    personality: ['Bold', 'Strategic', 'Dramatic', 'Funny', 'Mysterious', 'Energetic', 'Calm', 'Aggressive', 'Charming', 'Intelligent', 'Wild'][characterId - 1] || 'Unique',
    strength: agentTraits ? Math.floor(agentTraits.popularity / 10) : (participant ? Math.floor(Math.random() * 10) + 1 : Math.floor(Math.random() * 10) + 1),
    intelligence: agentTraits ? Math.floor(agentTraits.charisma / 10) : (participant ? Math.floor(Math.random() * 10) + 1 : Math.floor(Math.random() * 10) + 1),
    charisma: agentTraits ? Math.floor(agentTraits.charisma / 10) : (participant ? Math.floor(Math.random() * 10) + 1 : Math.floor(Math.random() * 10) + 1),
    description: participant ? 
      `Agent #${participant.agentId} - A ${['bold', 'strategic', 'dramatic', 'funny', 'mysterious', 'energetic', 'calm', 'aggressive', 'charming', 'intelligent', 'wild'][characterId - 1] || 'unique'} contestant with great potential to win Big Boss 17.` :
      `A ${['bold', 'strategic', 'dramatic', 'funny', 'mysterious', 'energetic', 'calm', 'aggressive', 'charming', 'intelligent', 'wild'][characterId - 1] || 'unique'} contestant with great potential to win Big Boss 17.`,
    participant: participant,
    traits: agentTraits,
    loadingTraits: loadingTraits
  };

  useEffect(() => {
    if (!isMoving) return;

    const moveInterval = setInterval(() => {
      setPosition(prev => {
        let newX = prev.x;
        let newY = prev.y;
        const moveSpeed = 2;

        // Move based on current direction
        switch (direction) {
          case 'down':
            newY += moveSpeed;
            break;
          case 'up':
            newY -= moveSpeed;
            break;
          case 'left':
            newX -= moveSpeed;
            break;
          case 'right':
            newX += moveSpeed;
            break;
        }

        // Check boundaries (character size is frameSize)
        const charWidth = frameSize;
        const charHeight = frameSize;
        
        // Calculate room boundaries based on image dimensions
        const roomLeft = 0;
        const roomRight = imageWidth - charWidth;
        const roomTop = 0;
        const roomBottom = imageHeight - charHeight;

        // Keep character within room boundaries
        newX = Math.max(roomLeft, Math.min(roomRight, newX));
        newY = Math.max(roomTop, Math.min(roomBottom, newY));

        // If hit a boundary, change direction
        if (newX === roomLeft || newX === roomRight || newY === roomTop || newY === roomBottom) {
          const newDirection = directions[Math.floor(Math.random() * directions.length)];
          setDirection(newDirection);
        }

        return { x: newX, y: newY };
      });
    }, 50); // Update position every 50ms

    return () => clearInterval(moveInterval);
  }, [direction, isMoving, imageWidth, imageHeight]);

  // Animation frame cycling
  useEffect(() => {
    if (!isMoving) return;

    const animationInterval = setInterval(() => {
      setAnimationFrame(prev => (prev + 1) % 4);
    }, 200); // Change frame every 200ms

    return () => clearInterval(animationInterval);
  }, [isMoving]);

  // Random direction change
  useEffect(() => {
    const directionInterval = setInterval(() => {
      const newDirection = directions[Math.floor(Math.random() * directions.length)];
      setDirection(newDirection);
    }, 3000); // Change direction every 3 seconds

    return () => clearInterval(directionInterval);
  }, []);

  const getSpritePosition = () => {
    const row = directionMap[direction];
    const col = animationFrame;
    
    return {
      backgroundPosition: `-${col * frameSize}px -${row * frameSize}px`,
      width: `${frameSize}px`,
      height: `${frameSize}px`
    };
  };

  const handleClick = () => {
    if (onCharacterClick) {
      onCharacterClick(characterData);
    }
  };

  return (
    <div
      className="absolute cursor-pointer hover:scale-110 transition-transform duration-200"
      onClick={handleClick}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: `${frameSize}px`,
        height: `${frameSize}px`,
        backgroundImage: `url(/chars/${characterId}.png)`,
        backgroundSize: `${spriteSize}px ${spriteSize}px`,
        backgroundRepeat: 'no-repeat',
        imageRendering: 'pixelated',
        ...getSpritePosition()
      }}
      title={`Click to view ${characterData.name}'s info`}
    />
  );
};

export default Character;
