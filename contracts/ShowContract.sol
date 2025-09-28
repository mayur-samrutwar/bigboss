// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title ShowContract
 * @dev A comprehensive show management system with agent participation and voting
 * Features:
 * - 12-hour show cycles with automatic management
 * - Agent registration and parameter management
 * - Voting system with entry fees
 * - Prize distribution with platform fees
 * - AI command system for agent manipulation
 */
contract ShowContract is ReentrancyGuard, Ownable, Pausable {
    
    // Address of the Cadence Arch contract for VRF
    address constant public cadenceArch = 0x0000000000000000000000010000000000000001;
    
    constructor() Ownable(msg.sender) {}
    
    // Events
    event ShowStarted(uint256 indexed showId, uint256 startTime, uint256 endTime, uint256 entryFee);
    event ShowEnded(uint256 indexed showId, uint256 winnerAgentId, uint256 totalPrize);
    event AgentRegistered(uint256 indexed agentId, address indexed owner, string name, uint256[] initialParams);
    event AgentParticipated(uint256 indexed showId, uint256 indexed agentId, address indexed owner);
    event AgentParametersUpdated(uint256 indexed agentId, uint256[] newParams, address indexed updater);
    event AgentKilled(uint256 indexed showId, uint256 indexed agentId, address indexed killer);
    event VoteCast(uint256 indexed showId, uint256 indexed agentId, address indexed voter, uint256 amount);
    event PrizeClaimed(uint256 indexed showId, uint256 indexed agentId, address indexed winner, uint256 amount);
    event EntryFeeUpdated(uint256 indexed showId, uint256 newEntryFee);
    event ShowCancelled(uint256 indexed showId, uint256 refundAmount);
    event ShowTimingUpdated(uint256 newDuration);
    
    // Constants
    uint256 public SHOW_DURATION = 30 minutes; // Made configurable
    uint256 public constant MAX_PARTICIPANTS_PER_SHOW = 10;
    uint256 public constant PLATFORM_FEE_PERCENTAGE = 10; // 10% platform fee
    uint256 public constant VOTE_FEE = 0.01 ether; // Fee for each vote
    uint256 public constant MIN_ENTRY_FEE = 0.001 ether;
    uint256 public constant MAX_ENTRY_FEE = 10 ether;
    uint256 public constant MIN_SHOW_DURATION = 5 minutes; // Minimum show duration
    uint256 public constant MAX_SHOW_DURATION = 24 hours; // Maximum show duration
    
    // Structs
    struct Show {
        uint256 showId;
        uint256 startTime;
        uint256 endTime;
        bool isActive;
        bool isEnded;
        uint256 entryFee;
        uint256 totalPrize;
        uint256 winnerAgentId;
        uint256[] participatingAgents;
        mapping(uint256 => uint256) agentVotes; // agentId => total votes
        mapping(address => mapping(uint256 => uint256)) userVotes; // user => agentId => votes
        mapping(address => bool) hasClaimedPrize;
        address[] participants;
    }
    
    struct Agent {
        uint256 agentId;
        address owner;
        string name;
        uint256[] parameters;
        bool isActive;
        bool isAlive;
        uint256 createdAt;
        uint256 lastUpdated;
    }
    
    // State variables
    mapping(uint256 => Show) public shows;
    mapping(uint256 => Agent) public agents;
    mapping(address => uint256[]) public userAgents; // user => agentIds
    mapping(address => bool) public authorizedAI; // AI addresses that can update agents
    
    uint256 public showCounter;
    uint256 public agentCounter;
    uint256 public currentShowId;
    uint256 public nextShowId; // ID of the next show users can participate in
    uint256 public totalPlatformFees;
    
    // Modifiers
    modifier showExists(uint256 _showId) {
        require(_showId > 0 && _showId <= showCounter, "Show does not exist");
        _;
    }
    
    modifier showActive(uint256 _showId) {
        require(shows[_showId].isActive && !shows[_showId].isEnded, "Show is not active");
        _;
    }
    
    modifier showEnded(uint256 _showId) {
        require(shows[_showId].isEnded, "Show has not ended yet");
        _;
    }
    
    modifier agentExists(uint256 _agentId) {
        require(_agentId > 0 && _agentId <= agentCounter, "Agent does not exist");
        _;
    }
    
    modifier agentActive(uint256 _agentId) {
        require(agents[_agentId].isActive, "Agent is not active");
        _;
    }
    
    modifier agentAlive(uint256 _agentId) {
        require(agents[_agentId].isAlive, "Agent is dead");
        _;
    }
    
    modifier onlyAI() {
        require(authorizedAI[msg.sender] || msg.sender == owner(), "Only authorized AI or owner");
        _;
    }
    
    modifier validEntryFee(uint256 _fee) {
        require(_fee >= MIN_ENTRY_FEE && _fee <= MAX_ENTRY_FEE, "Invalid entry fee");
        _;
    }
    
    /**
     * @dev Generate a random number using Flow's VRF with better error handling
     */
    function getRandomNumber() public view returns (uint64) {
        // Try different function signatures in case the documentation is outdated
        bytes memory callData1 = abi.encodeWithSignature("revertibleRandom()");
        bytes memory callData2 = abi.encodeWithSignature("revertibleRandom(uint64)");
        bytes memory callData3 = abi.encodeWithSignature("getRandom()");
        
        (bool ok, bytes memory data) = cadenceArch.staticcall(callData1);
        
        if (!ok) {
            // Try alternative signatures
            (ok, data) = cadenceArch.staticcall(callData2);
            if (!ok) {
                (ok, data) = cadenceArch.staticcall(callData3);
            }
        }
        
        if (!ok) {
            // Try to decode the error message
            if (data.length > 0) {
                string memory errorMessage = string(data);
                revert(string(abi.encodePacked("VRF call failed: ", errorMessage)));
            } else {
                revert("VRF call failed: All function signatures failed");
            }
        }
        
        if (data.length == 0) {
            revert("VRF call failed: Empty response");
        }
        
        return abi.decode(data, (uint64));
    }
    
    /**
     * @dev Test function to debug VRF calls (remove in production)
     */
    function testVRF() external view returns (bool, bytes memory) {
        return cadenceArch.staticcall(abi.encodeWithSignature("revertibleRandom()"));
    }
    
    /**
     * @dev Generate a random number within a range
     * @param min Minimum value
     * @param max Maximum value
     */
    function getRandomInRange(uint64 min, uint64 max) internal view returns (uint64) {
        require(max >= min, "Max must be >= min");
        uint64 randomNumber = getRandomNumber();
        return (randomNumber % (max + 1 - min)) + min;
    }
    
    /**
     * @dev Generate random traits for a new agent with VRF fallback
     * Returns array of 7 traits: [Popularity, Aggression, Loyalty, Resilience, Charisma, Suspicion, Energy]
     */
    function generateRandomTraits() internal view returns (uint256[] memory) {
        uint256[] memory traits = new uint256[](7);
        
        try this.getRandomNumber() returns (uint64 randomSeed) {
            // Use VRF if available
            traits[0] = 30 + (randomSeed % 51);        // Popularity: 30-80
            traits[1] = 20 + ((randomSeed >> 8) % 51); // Aggression: 20-70
            traits[2] = 40 + ((randomSeed >> 16) % 51); // Loyalty: 40-90
            traits[3] = 30 + ((randomSeed >> 24) % 56); // Resilience: 30-85
            traits[4] = 25 + ((randomSeed >> 32) % 66); // Charisma: 25-90
            traits[5] = 10 + ((randomSeed >> 40) % 51); // Suspicion: 10-60
            traits[6] = 60 + ((randomSeed >> 48) % 41); // Energy: 60-100
        } catch {
            // Fallback to block-based randomness if VRF fails
            uint256 seed = uint256(keccak256(abi.encodePacked(
                block.timestamp,
                block.difficulty,
                block.coinbase,
                msg.sender,
                agentCounter
            )));
            
            traits[0] = 30 + (seed % 51);
            traits[1] = 20 + ((seed >> 8) % 51);
            traits[2] = 40 + ((seed >> 16) % 51);
            traits[3] = 30 + ((seed >> 24) % 56);
            traits[4] = 25 + ((seed >> 32) % 66);
            traits[5] = 10 + ((seed >> 40) % 51);
            traits[6] = 60 + ((seed >> 48) % 41);
        }
        
        return traits;
    }
    
    /**
     * @dev Start a new show (called manually by owner)
     */
    function startShow() external onlyOwner whenNotPaused {
        require(nextShowId == 0, "Next show already exists");
        _startNewShow();
    }
    
    function _startNewShow() internal {
        showCounter++;
        nextShowId = showCounter;
        
        shows[nextShowId].showId = nextShowId;
        shows[nextShowId].startTime = 0; // Will be set when show actually begins
        shows[nextShowId].endTime = 0; // Will be set when show actually begins
        shows[nextShowId].isActive = false; // Show is in preparation phase, not active yet
        shows[nextShowId].isEnded = false;
        shows[nextShowId].entryFee = 0.01 ether; // Default entry fee
        
        emit ShowStarted(nextShowId, 0, 0, shows[nextShowId].entryFee);
    }
    
    /**
     * @dev Begin the next show (transition from nextShowId to currentShowId)
     * This should be called when the show actually starts playing
     */
    function beginShow() external onlyOwner {
        require(nextShowId > 0, "No next show available");
        require(currentShowId == 0 || shows[currentShowId].isEnded, "Current show is still active");
        
        currentShowId = nextShowId;
        nextShowId = 0; // Clear next show since it's now current
        
        // Set the actual start and end times when the show begins
        shows[currentShowId].startTime = block.timestamp;
        shows[currentShowId].endTime = block.timestamp + SHOW_DURATION;
        shows[currentShowId].isActive = true;
        
        emit ShowStarted(currentShowId, shows[currentShowId].startTime, shows[currentShowId].endTime, shows[currentShowId].entryFee);
    }
    
    /**
     * @dev End the current show and determine winner
     * @param _winnerAgentId ID of the winning agent
     */
    function endShow(uint256 _winnerAgentId) external onlyOwner showExists(currentShowId) showActive(currentShowId) agentExists(_winnerAgentId) {
        require(shows[currentShowId].participatingAgents.length > 0, "No agents participated");
        
        // Allow ending if either:
        // 1. Time has passed (normal end)
        // 2. Only 1 agent left (early end due to elimination)
        bool timeHasPassed = block.timestamp >= shows[currentShowId].endTime;
        bool onlyOneAgentLeft = shows[currentShowId].participatingAgents.length == 1;
        
        require(timeHasPassed || onlyOneAgentLeft, "Show cannot be ended yet");
        
        shows[currentShowId].isActive = false;
        shows[currentShowId].isEnded = true;
        shows[currentShowId].winnerAgentId = _winnerAgentId;
        
        // Calculate platform fee
        uint256 platformFee = (shows[currentShowId].totalPrize * PLATFORM_FEE_PERCENTAGE) / 100;
        totalPlatformFees += platformFee;
        
        emit ShowEnded(currentShowId, _winnerAgentId, shows[currentShowId].totalPrize);
        
        // Reset current show
        currentShowId = 0;
    }
    
    /**
     * @dev Check show status and automatically end if time has passed
     * @param _showId ID of the show to check
     */
    function checkStatus(uint256 _showId) external onlyOwner showExists(_showId) {
        Show storage show = shows[_showId];
        
        // Check if show is still active but time has passed
        if (show.isActive && block.timestamp >= show.endTime) {
            require(show.participatingAgents.length > 0, "No agents participated");
            
            // Find the last remaining alive agent
            uint256 winnerAgentId = 0;
            for (uint256 i = 0; i < show.participatingAgents.length; i++) {
                uint256 agentId = show.participatingAgents[i];
                if (agents[agentId].isAlive) {
                    winnerAgentId = agentId;
                    break;
                }
            }
            
            require(winnerAgentId > 0, "No alive agents found");
            
            // End the show with the winner
            show.isActive = false;
            show.isEnded = true;
            show.winnerAgentId = winnerAgentId;
            
            // Calculate platform fee
            uint256 platformFee = (show.totalPrize * PLATFORM_FEE_PERCENTAGE) / 100;
            totalPlatformFees += platformFee;
            
            // Calculate net prize for winner
            uint256 netPrize = show.totalPrize - platformFee;
            
            // Transfer prize to winner's owner
            if (netPrize > 0 && address(this).balance >= netPrize) {
                address winnerOwner = agents[winnerAgentId].owner;
                show.hasClaimedPrize[winnerOwner] = true;
                
                (bool success, ) = payable(winnerOwner).call{value: netPrize}("");
                require(success, "Prize transfer failed");
                
                emit PrizeClaimed(_showId, winnerAgentId, winnerOwner, netPrize);
            }
            
            emit ShowEnded(_showId, winnerAgentId, show.totalPrize);
            
            // Reset current show if this was the current show
            if (_showId == currentShowId) {
                currentShowId = 0;
            }
        }
    }
    
    /**
     * @dev Get current active show information
     */
    function getCurrentShow() external view returns (
        uint256 showId,
        uint256 startTime,
        uint256 endTime,
        bool isActive,
        uint256 entryFee,
        uint256 totalPrize,
        uint256 participantCount
    ) {
        if (currentShowId == 0) {
            return (0, 0, 0, false, 0, 0, 0);
        }
        
        Show storage show = shows[currentShowId];
        return (
            show.showId,
            show.startTime,
            show.endTime,
            show.isActive,
            show.entryFee,
            show.totalPrize,
            show.participatingAgents.length
        );
    }
    
    /**
     * @dev Get next show information (for participation)
     */
    function getNextShow() external view returns (
        uint256 showId,
        uint256 startTime,
        uint256 endTime,
        bool isActive,
        uint256 entryFee,
        uint256 totalPrize,
        uint256 participantCount
    ) {
        if (nextShowId == 0) {
            return (0, 0, 0, false, 0, 0, 0);
        }
        
        Show storage show = shows[nextShowId];
        return (
            show.showId,
            show.startTime,
            show.endTime,
            show.isActive,
            show.entryFee,
            show.totalPrize,
            show.participatingAgents.length
        );
    }
    
    /**
     * @dev Get winner of a specific show
     * @param _showId ID of the show
     */
    function getWinnerOfShow(uint256 _showId) external view showExists(_showId) showEnded(_showId) returns (
        uint256 winnerAgentId,
        string memory winnerName,
        uint256 totalVotes,
        uint256 prizeAmount
    ) {
        Show storage show = shows[_showId];
        Agent storage winner = agents[show.winnerAgentId];
        
        uint256 platformFee = (show.totalPrize * PLATFORM_FEE_PERCENTAGE) / 100;
        uint256 netPrize = show.totalPrize - platformFee;
        
        return (
            show.winnerAgentId,
            winner.name,
            show.agentVotes[show.winnerAgentId],
            netPrize
        );
    }
    
    /**
     * @dev Get reward amount for a specific show
     * @param _showId ID of the show
     */
    function getRewardOfShow(uint256 _showId) external view showExists(_showId) showEnded(_showId) returns (uint256) {
        Show storage show = shows[_showId];
        uint256 platformFee = (show.totalPrize * PLATFORM_FEE_PERCENTAGE) / 100;
        return show.totalPrize - platformFee;
    }
    
    /**
     * @dev Register a new agent with random traits
     * @param _name Name of the agent
     */
    function registerAgent(
        string memory _name
    ) external whenNotPaused {
        require(bytes(_name).length > 0, "Agent name cannot be empty");
        
        agentCounter++;
        uint256 agentId = agentCounter;
        
        // Generate random traits using Flow's VRF
        uint256[] memory randomTraits = generateRandomTraits();
        
        agents[agentId] = Agent({
            agentId: agentId,
            owner: msg.sender,
            name: _name,
            parameters: randomTraits,
            isActive: true,
            isAlive: true,
            createdAt: block.timestamp,
            lastUpdated: block.timestamp
        });
        
        userAgents[msg.sender].push(agentId);
        
        emit AgentRegistered(agentId, msg.sender, _name, randomTraits);
    }
    
    /**
     * @dev Participate in the next show with an agent
     * @param _agentId ID of the agent
     */
    function participateInNextShow(
        uint256 _agentId
    ) external payable nonReentrant agentExists(_agentId) agentActive(_agentId) {
        require(nextShowId > 0, "No next show available for participation");
        require(agents[_agentId].owner == msg.sender, "Not the agent owner");
        require(shows[nextShowId].participatingAgents.length < MAX_PARTICIPANTS_PER_SHOW, "Next show is full");
        require(msg.value == shows[nextShowId].entryFee, "Incorrect entry fee");
        require(!_isAgentParticipating(nextShowId, _agentId), "Agent already participating in next show");
        
        // Reset agent to alive status when joining next show
        agents[_agentId].isAlive = true;
        
        shows[nextShowId].participatingAgents.push(_agentId);
        shows[nextShowId].totalPrize += msg.value;
        shows[nextShowId].participants.push(msg.sender);
        
        emit AgentParticipated(nextShowId, _agentId, msg.sender);
    }
    
    /**
     * @dev Participate in a show with an agent (legacy function for backward compatibility)
     * @param _showId ID of the show
     * @param _agentId ID of the agent
     */
    function participateInShow(
        uint256 _showId,
        uint256 _agentId
    ) external payable nonReentrant showExists(_showId) agentExists(_agentId) agentActive(_agentId) {
        require(_showId == nextShowId, "Can only participate in next show");
        require(agents[_agentId].owner == msg.sender, "Not the agent owner");
        require(block.timestamp < shows[_showId].endTime, "Show has ended");
        require(shows[_showId].participatingAgents.length < MAX_PARTICIPANTS_PER_SHOW, "Show is full");
        require(msg.value == shows[_showId].entryFee, "Incorrect entry fee");
        require(!_isAgentParticipating(_showId, _agentId), "Agent already participating");
        
        // Reset agent to alive status when joining show
        agents[_agentId].isAlive = true;
        
        shows[_showId].participatingAgents.push(_agentId);
        shows[_showId].totalPrize += msg.value;
        shows[_showId].participants.push(msg.sender);
        
        emit AgentParticipated(_showId, _agentId, msg.sender);
    }
    
    /**
     * @dev Update agent parameters (AI or owner only)
     * @param _agentId ID of the agent
     * @param _newParameters New parameters array
     */
    function updateAgentParams(
        uint256 _agentId,
        uint256[] memory _newParameters
    ) external agentExists(_agentId) agentActive(_agentId) agentAlive(_agentId) {
        require(
            agents[_agentId].owner == msg.sender || authorizedAI[msg.sender] || msg.sender == owner(),
            "Not authorized to update agent"
        );
        require(_newParameters.length > 0, "Parameters cannot be empty");
        require(_newParameters.length <= 20, "Too many parameters");
        
        agents[_agentId].parameters = _newParameters;
        agents[_agentId].lastUpdated = block.timestamp;
        
        emit AgentParametersUpdated(_agentId, _newParameters, msg.sender);
    }
    
    /**
     * @dev Kill an agent (AI only)
     * @param _showId ID of the show
     * @param _agentId ID of the agent to kill
     */
    function killAgent(
        uint256 _showId,
        uint256 _agentId
    ) external onlyAI showExists(_showId) showActive(_showId) agentExists(_agentId) agentActive(_agentId) agentAlive(_agentId) {
        require(_isAgentParticipating(_showId, _agentId), "Agent not participating in this show");
        
        agents[_agentId].isAlive = false;
        
        // Remove agent from participatingAgents array
        uint256[] storage participants = shows[_showId].participatingAgents;
        for (uint256 i = 0; i < participants.length; i++) {
            if (participants[i] == _agentId) {
                participants[i] = participants[participants.length - 1];
                participants.pop();
                break;
            }
        }
        
        emit AgentKilled(_showId, _agentId, msg.sender);
    }
    
    /**
     * @dev Vote for an agent in a show
     * @param _showId ID of the show
     * @param _agentId ID of the agent to vote for
     */
    function voteForAgent(
        uint256 _showId,
        uint256 _agentId
    ) external payable nonReentrant showExists(_showId) showActive(_showId) agentExists(_agentId) agentActive(_agentId) agentAlive(_agentId) {
        require(block.timestamp < shows[_showId].endTime, "Show has ended");
        require(msg.value == VOTE_FEE, "Incorrect vote fee");
        require(_isAgentParticipating(_showId, _agentId), "Agent not participating in this show");
        
        shows[_showId].agentVotes[_agentId]++;
        shows[_showId].userVotes[msg.sender][_agentId]++;
        shows[_showId].totalPrize += msg.value;
        
        emit VoteCast(_showId, _agentId, msg.sender, msg.value);
    }
    
    /**
     * @dev Claim prize for winning agent
     * @param _showId ID of the show
     */
    function claimPrize(uint256 _showId) external nonReentrant showExists(_showId) showEnded(_showId) {
        Show storage show = shows[_showId];
        require(show.winnerAgentId > 0, "No winner determined");
        require(agents[show.winnerAgentId].owner == msg.sender, "Not the winner's owner");
        require(!show.hasClaimedPrize[msg.sender], "Prize already claimed");
        
        uint256 platformFee = (show.totalPrize * PLATFORM_FEE_PERCENTAGE) / 100;
        uint256 netPrize = show.totalPrize - platformFee;
        
        require(netPrize > 0, "No prize to claim");
        require(address(this).balance >= netPrize, "Insufficient contract balance");
        
        show.hasClaimedPrize[msg.sender] = true;
        
        (bool success, ) = payable(msg.sender).call{value: netPrize}("");
        require(success, "Transfer failed");
        
        emit PrizeClaimed(_showId, show.winnerAgentId, msg.sender, netPrize);
    }
    
    /**
     * @dev Update entry fee for current show (owner only)
     * @param _newEntryFee New entry fee
     */
    function updateEntryFee(uint256 _newEntryFee) external onlyOwner validEntryFee(_newEntryFee) {
        require(currentShowId > 0 && shows[currentShowId].isActive, "No active show");
        require(shows[currentShowId].participatingAgents.length == 0, "Cannot change fee after participants joined");
        
        shows[currentShowId].entryFee = _newEntryFee;
        
        emit EntryFeeUpdated(currentShowId, _newEntryFee);
    }
    
    /**
     * @dev Update show duration for future shows (owner only)
     * @param _newDuration New show duration in seconds
     */
    function updateShowTiming(uint256 _newDuration) external onlyOwner {
        require(_newDuration >= MIN_SHOW_DURATION && _newDuration <= MAX_SHOW_DURATION, "Invalid show duration");
        
        SHOW_DURATION = _newDuration;
        
        emit ShowTimingUpdated(_newDuration);
    }
    
    /**
     * @dev Authorize AI address (owner only)
     * @param _aiAddress AI address to authorize
     */
    function authorizeAI(address _aiAddress) external onlyOwner {
        require(_aiAddress != address(0), "Invalid AI address");
        authorizedAI[_aiAddress] = true;
    }
    
    /**
     * @dev Revoke AI authorization (owner only)
     * @param _aiAddress AI address to revoke
     */
    function revokeAI(address _aiAddress) external onlyOwner {
        authorizedAI[_aiAddress] = false;
    }
    
    /**
     * @dev Get agent information
     * @param _agentId ID of the agent
     */
    function getAgentInfo(uint256 _agentId) external view agentExists(_agentId) returns (
        uint256 agentId,
        address owner,
        string memory name,
        uint256[] memory parameters,
        bool isActive,
        bool isAlive,
        uint256 createdAt,
        uint256 lastUpdated
    ) {
        Agent storage agent = agents[_agentId];
        return (
            agent.agentId,
            agent.owner,
            agent.name,
            agent.parameters,
            agent.isActive,
            agent.isAlive,
            agent.createdAt,
            agent.lastUpdated
        );
    }
    
    /**
     * @dev Get show participants
     * @param _showId ID of the show
     */
    function getShowParticipants(uint256 _showId) external view showExists(_showId) returns (
        uint256[] memory agentIds,
        address[] memory participantAddresses
    ) {
        return (shows[_showId].participatingAgents, shows[_showId].participants);
    }
    
    /**
     * @dev Get next show participants
     */
    function getNextShowParticipants() external view returns (
        uint256[] memory agentIds,
        address[] memory participantAddresses
    ) {
        if (nextShowId == 0) {
            return (new uint256[](0), new address[](0));
        }
        return (shows[nextShowId].participatingAgents, shows[nextShowId].participants);
    }
    
    /**
     * @dev Get user's agents
     * @param _user User address
     */
    function getUserAgents(address _user) external view returns (uint256[] memory) {
        return userAgents[_user];
    }
    
    /**
     * @dev Check if agent is participating in show
     * @param _showId ID of the show
     * @param _agentId ID of the agent
     */
    function _isAgentParticipating(uint256 _showId, uint256 _agentId) internal view returns (bool) {
        uint256[] memory participatingAgents = shows[_showId].participatingAgents;
        for (uint256 i = 0; i < participatingAgents.length; i++) {
            if (participatingAgents[i] == _agentId) {
                return true;
            }
        }
        return false;
    }
    
    /**
     * @dev Withdraw platform fees (owner only)
     */
    function withdrawPlatformFees() external onlyOwner {
        require(totalPlatformFees > 0, "No fees to withdraw");
        require(address(this).balance >= totalPlatformFees, "Insufficient balance");
        
        uint256 amount = totalPlatformFees;
        totalPlatformFees = 0;
        
        (bool success, ) = payable(owner()).call{value: amount}("");
        require(success, "Withdrawal failed");
    }
    
    /**
     * @dev Pause the contract (owner only)
     */
    function pause() external onlyOwner {
        _pause();
    }
    
    /**
     * @dev Unpause the contract (owner only)
     */
    function unpause() external onlyOwner {
        _unpause();
    }
    
    /**
     * @dev Get contract balance
     */
    function getContractBalance() external view returns (uint256) {
        return address(this).balance;
    }
    
    /**
     * @dev Emergency withdraw (owner only) - use only in extreme cases
     */
    function emergencyWithdraw() external onlyOwner {
        require(paused(), "Contract must be paused");
        (bool success, ) = payable(owner()).call{value: address(this).balance}("");
        require(success, "Emergency withdrawal failed");
    }
    
    /**
     * @dev Check if show can be started (for automation)
     */
    function canStartNewShow() external view returns (bool) {
        return currentShowId == 0 || shows[currentShowId].isEnded;
    }
    
    /**
     * @dev Get time until current show ends
     */
    function getTimeUntilShowEnds() external view returns (uint256) {
        if (currentShowId == 0 || !shows[currentShowId].isActive) {
            return 0;
        }
        
        if (block.timestamp >= shows[currentShowId].endTime) {
            return 0;
        }
        
        return shows[currentShowId].endTime - block.timestamp;
    }

    /**
     * @dev Get vote count for an agent in a show
     * @param _showId ID of the show
     * @param _agentId ID of the agent
     * @return Vote count for the agent
     */
    function getAgentVoteCount(uint256 _showId, uint256 _agentId) external view showExists(_showId) returns (uint256) {
        return shows[_showId].agentVotes[_agentId];
    }

    /**
     * @dev Get vote counts for all agents in a show
     * @param _showId ID of the show
     * @param _agentIds Array of agent IDs
     * @return Array of vote counts corresponding to agent IDs
     */
    function getAgentVoteCounts(uint256 _showId, uint256[] calldata _agentIds) external view showExists(_showId) returns (uint256[] memory) {
        uint256[] memory voteCounts = new uint256[](_agentIds.length);
        for (uint256 i = 0; i < _agentIds.length; i++) {
            voteCounts[i] = shows[_showId].agentVotes[_agentIds[i]];
        }
        return voteCounts;
    }
}
