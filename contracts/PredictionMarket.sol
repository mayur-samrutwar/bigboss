// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

// Interface for ShowContract
interface IShowContract {
    function getCurrentShow() external view returns (
        uint256 showId,
        string memory name,
        uint256 startTime,
        uint256 endTime,
        bool isActive,
        uint256 prizePool,
        uint256 participantCount
    );
    function getShowParticipants(uint256 _showId) external view returns (uint256[] memory);
    function getAgentInfo(uint256 _agentId) external view returns (
        string memory name,
        uint256[7] memory traits,
        bool isAlive,
        uint256 showId
    );
    function getAgentVoteCount(uint256 _showId, uint256 _agentId) external view returns (uint256);
}

/**
 * @title PredictionMarket
 * @dev A prediction market integrated with ShowContract
 * Users can predict winners for ongoing shows from the main contract
 * Each prediction costs 0.01 ETH per contract
 * All lost money goes to winners, proportionally divided
 */
contract PredictionMarket is ReentrancyGuard, Ownable, Pausable {
    
    // Events
    event PredictionPlaced(uint256 indexed showId, address indexed user, uint256 agentId, uint256 contracts);
    event ShowEnded(uint256 indexed showId, uint256 winnerId, uint256 totalPrize);
    event PrizeRedeemed(uint256 indexed showId, address indexed user, uint256 amount);
    
    // Constants
    uint256 public constant CONTRACT_COST = 0.01 ether; // 0.01 ETH per prediction contract
    uint256 public constant MIN_CONTRACTS = 1;
    uint256 public constant MAX_CONTRACTS = 100; // Prevent excessive gas usage
    uint256 public constant FEE_PERCENTAGE = 2; // 2% platform fee
    
    // State variables
    IShowContract public showContract;
    uint256 public totalFees;
    
    // Structs for predictions
    struct Prediction {
        uint256 contracts; // Number of contracts bought
        bool hasRedeemed;
    }
    
    struct ShowPrediction {
        mapping(uint256 => uint256) totalContractsPerAgent; // agentId => total contracts
        mapping(address => mapping(uint256 => Prediction)) userPredictions; // user => agentId => Prediction
        mapping(address => bool) hasRedeemed;
        address[] participants;
        uint256 totalPrize;
        uint256 winnerId;
        bool isEnded;
    }
    
    // State variables
    mapping(uint256 => ShowPrediction) public showPredictions; // showId => ShowPrediction
    
    // Modifiers
    modifier showActive(uint256 _showId) {
        (,,,uint256 endTime, bool isActive,,) = showContract.getCurrentShow();
        require(isActive && block.timestamp < endTime, "Show is not active");
        _;
    }
    
    modifier showEnded(uint256 _showId) {
        require(showPredictions[_showId].isEnded, "Show has not ended yet");
        _;
    }
    
    modifier validAgent(uint256 _showId, uint256 _agentId) {
        uint256[] memory participants = showContract.getShowParticipants(_showId);
        bool agentExists = false;
        for (uint256 i = 0; i < participants.length; i++) {
            if (participants[i] == _agentId) {
                agentExists = true;
                break;
            }
        }
        require(agentExists, "Agent does not exist in this show");
        _;
    }
    
    modifier validContractAmount(uint256 _contracts) {
        require(_contracts >= MIN_CONTRACTS && _contracts <= MAX_CONTRACTS, "Invalid contract amount");
        _;
    }
    
    constructor(address _showContract) Ownable(msg.sender) {
        showContract = IShowContract(_showContract);
    }
    
    /**
     * @dev Place a prediction on a show agent
     * @param _showId ID of the show
     * @param _agentId ID of the agent to predict
     * @param _contracts Number of contracts to buy
     */
    function placePrediction(
        uint256 _showId,
        uint256 _agentId,
        uint256 _contracts
    ) external payable nonReentrant whenNotPaused showActive(_showId) validAgent(_showId, _agentId) validContractAmount(_contracts) {
        require(msg.value == _contracts * CONTRACT_COST, "Incorrect payment amount");
        
        // Update prediction state
        showPredictions[_showId].totalContractsPerAgent[_agentId] += _contracts;
        showPredictions[_showId].userPredictions[msg.sender][_agentId].contracts += _contracts;
        showPredictions[_showId].totalPrize += msg.value;
        
        // Add participant if not already added
        if (showPredictions[_showId].userPredictions[msg.sender][_agentId].contracts == _contracts) {
            showPredictions[_showId].participants.push(msg.sender);
        }
        
        emit PredictionPlaced(_showId, msg.sender, _agentId, _contracts);
    }
    
    /**
     * @dev End a show and determine the winner (called by owner)
     * @param _showId ID of the show
     * @param _winnerId ID of the winning agent
     */
    function endShow(uint256 _showId, uint256 _winnerId) external onlyOwner showActive(_showId) validAgent(_showId, _winnerId) {
        require(showPredictions[_showId].totalPrize > 0, "No predictions placed on this show");
        
        showPredictions[_showId].isEnded = true;
        showPredictions[_showId].winnerId = _winnerId;
        
        // Calculate platform fee
        uint256 platformFee = (showPredictions[_showId].totalPrize * FEE_PERCENTAGE) / 100;
        totalFees += platformFee;
        
        emit ShowEnded(_showId, _winnerId, showPredictions[_showId].totalPrize);
    }
    
    /**
     * @dev Get the winner of a show
     * @param _showId ID of the show
     * @return winnerId ID of the winning agent
     * @return winnerName Name of the winning agent
     * @return totalContracts Total contracts for the winner
     */
    function getWinnerOfShow(uint256 _showId) external view showEnded(_showId) returns (
        uint256 winnerId,
        string memory winnerName,
        uint256 totalContracts
    ) {
        winnerId = showPredictions[_showId].winnerId;
        (winnerName,,,) = showContract.getAgentInfo(winnerId);
        totalContracts = showPredictions[_showId].totalContractsPerAgent[winnerId];
    }
    
    /**
     * @dev Redeem prize for a winning prediction
     * @param _showId ID of the show
     */
    function redeemPrize(uint256 _showId) external nonReentrant showEnded(_showId) {
        require(!showPredictions[_showId].hasRedeemed[msg.sender], "Already redeemed");
        require(showPredictions[_showId].userPredictions[msg.sender][showPredictions[_showId].winnerId].contracts > 0, "No winning predictions");
        
        uint256 userContracts = showPredictions[_showId].userPredictions[msg.sender][showPredictions[_showId].winnerId].contracts;
        uint256 totalWinnerContracts = showPredictions[_showId].totalContractsPerAgent[showPredictions[_showId].winnerId];
        uint256 platformFee = (showPredictions[_showId].totalPrize * FEE_PERCENTAGE) / 100;
        uint256 netPrize = showPredictions[_showId].totalPrize - platformFee;
        
        // Calculate user's share of the prize
        uint256 userPrize = (netPrize * userContracts) / totalWinnerContracts;
        
        require(userPrize > 0, "No prize to redeem");
        require(address(this).balance >= userPrize, "Insufficient contract balance");
        
        showPredictions[_showId].hasRedeemed[msg.sender] = true;
        
        (bool success, ) = payable(msg.sender).call{value: userPrize}("");
        require(success, "Transfer failed");
        
        emit PrizeRedeemed(_showId, msg.sender, userPrize);
    }
    
    /**
     * @dev Get show prediction information
     * @param _showId ID of the show
     */
    function getShowPredictionInfo(uint256 _showId) external view returns (
        uint256 totalPrize,
        uint256 participantCount,
        bool isEnded,
        uint256 winnerId
    ) {
        return (
            showPredictions[_showId].totalPrize,
            showPredictions[_showId].participants.length,
            showPredictions[_showId].isEnded,
            showPredictions[_showId].winnerId
        );
    }
    
    /**
     * @dev Get agent prediction information
     * @param _showId ID of the show
     * @param _agentId ID of the agent
     */
    function getAgentPredictionInfo(uint256 _showId, uint256 _agentId) external view returns (
        string memory name,
        uint256 totalContracts
    ) {
        (name,,,) = showContract.getAgentInfo(_agentId);
        totalContracts = showPredictions[_showId].totalContractsPerAgent[_agentId];
    }
    
    /**
     * @dev Get user's predictions for a specific agent
     * @param _showId ID of the show
     * @param _agentId ID of the agent
     * @param _user User address
     */
    function getUserPredictions(uint256 _showId, uint256 _agentId, address _user) external view returns (uint256) {
        return showPredictions[_showId].userPredictions[_user][_agentId].contracts;
    }
    
    /**
     * @dev Get current show information from main contract
     */
    function getCurrentShowInfo() external view returns (
        uint256 showId,
        string memory name,
        uint256 startTime,
        uint256 endTime,
        bool isActive,
        uint256 prizePool,
        uint256 participantCount
    ) {
        return showContract.getCurrentShow();
    }
    
    /**
     * @dev Get show participants from main contract
     * @param _showId ID of the show
     */
    function getShowParticipants(uint256 _showId) external view returns (uint256[] memory) {
        return showContract.getShowParticipants(_showId);
    }
    
    /**
     * @dev Update show contract address (owner only)
     * @param _newShowContract New show contract address
     */
    function updateShowContract(address _newShowContract) external onlyOwner {
        showContract = IShowContract(_newShowContract);
    }
    
    /**
     * @dev Withdraw platform fees (owner only)
     */
    function withdrawFees() external onlyOwner {
        require(totalFees > 0, "No fees to withdraw");
        require(address(this).balance >= totalFees, "Insufficient balance");
        
        uint256 amount = totalFees;
        totalFees = 0;
        
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
}
