// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title PredictionMarket
 * @dev A simple prediction market where users bet on show winners
 * Each vote costs 1 ETH (or 1 FLOW equivalent)
 * All lost money goes to winners, equally divided
 */
contract PredictionMarket is ReentrancyGuard, Ownable, Pausable {
    
    // Events
    event ShowCreated(uint256 indexed showId, string showName, uint256 endTime);
    event BetPlaced(uint256 indexed showId, address indexed user, uint256 votes, uint256 totalVotes);
    event ShowEnded(uint256 indexed showId, uint256 winnerId, uint256 totalPrize);
    event PrizeRedeemed(uint256 indexed showId, address indexed user, uint256 amount);
    event ShowCancelled(uint256 indexed showId, uint256 refundAmount);
    
    // Constants
    uint256 public constant VOTE_COST = 1 ether; // 1 ETH per vote (or 1 FLOW equivalent)
    uint256 public constant MIN_VOTES = 1;
    uint256 public constant MAX_VOTES = 1000; // Prevent excessive gas usage
    uint256 public constant MIN_SHOW_DURATION = 1 hours;
    uint256 public constant MAX_SHOW_DURATION = 365 days;
    
    // Structs
    struct Show {
        string name;
        uint256 endTime;
        bool isActive;
        bool isEnded;
        uint256 winnerId;
        uint256 totalPrize;
        mapping(uint256 => uint256) votesPerContestant; // contestantId => total votes
        mapping(address => mapping(uint256 => uint256)) userVotes; // user => contestantId => votes
        mapping(address => bool) hasRedeemed;
        address[] participants;
    }
    
    struct Contestant {
        string name;
        bool exists;
    }
    
    // State variables
    mapping(uint256 => Show) public shows;
    mapping(uint256 => mapping(uint256 => Contestant)) public contestants; // showId => contestantId => Contestant
    mapping(uint256 => uint256) public contestantCount; // showId => count
    uint256 public showCounter;
    uint256 public totalFees;
    uint256 public feePercentage = 2; // 2% platform fee
    
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
    
    modifier validContestant(uint256 _showId, uint256 _contestantId) {
        require(contestants[_showId][_contestantId].exists, "Contestant does not exist");
        _;
    }
    
    modifier validVoteAmount(uint256 _votes) {
        require(_votes >= MIN_VOTES && _votes <= MAX_VOTES, "Invalid vote amount");
        _;
    }
    
    constructor() Ownable(msg.sender) {}
    
    /**
     * @dev Create a new show with contestants
     * @param _showName Name of the show
     * @param _contestantNames Array of contestant names
     * @param _duration Duration of the show in seconds
     */
    function createShow(
        string memory _showName,
        string[] memory _contestantNames,
        uint256 _duration
    ) external onlyOwner whenNotPaused {
        require(bytes(_showName).length > 0, "Show name cannot be empty");
        require(_contestantNames.length >= 2, "At least 2 contestants required");
        require(_contestantNames.length <= 50, "Too many contestants");
        require(_duration >= MIN_SHOW_DURATION && _duration <= MAX_SHOW_DURATION, "Invalid duration");
        
        showCounter++;
        uint256 showId = showCounter;
        
        shows[showId].name = _showName;
        shows[showId].endTime = block.timestamp + _duration;
        shows[showId].isActive = true;
        shows[showId].isEnded = false;
        
        // Add contestants
        for (uint256 i = 0; i < _contestantNames.length; i++) {
            require(bytes(_contestantNames[i]).length > 0, "Contestant name cannot be empty");
            contestants[showId][i + 1] = Contestant({
                name: _contestantNames[i],
                exists: true
            });
        }
        contestantCount[showId] = _contestantNames.length;
        
        emit ShowCreated(showId, _showName, shows[showId].endTime);
    }
    
    /**
     * @dev Place a bet on a show contestant
     * @param _showId ID of the show
     * @param _contestantId ID of the contestant to bet on
     * @param _votes Number of votes (each costs 1 ETH)
     */
    function bet(
        uint256 _showId,
        uint256 _contestantId,
        uint256 _votes
    ) external payable nonReentrant whenNotPaused showExists(_showId) showActive(_showId) validContestant(_showId, _contestantId) validVoteAmount(_votes) {
        require(block.timestamp < shows[_showId].endTime, "Show has ended");
        require(msg.value == _votes * VOTE_COST, "Incorrect payment amount");
        
        // Update show state
        shows[_showId].votesPerContestant[_contestantId] += _votes;
        shows[_showId].userVotes[msg.sender][_contestantId] += _votes;
        shows[_showId].totalPrize += msg.value;
        
        // Add participant if not already added
        if (shows[_showId].userVotes[msg.sender][_contestantId] == _votes) {
            shows[_showId].participants.push(msg.sender);
        }
        
        emit BetPlaced(_showId, msg.sender, _votes, shows[_showId].votesPerContestant[_contestantId]);
    }
    
    /**
     * @dev End a show and determine the winner
     * @param _showId ID of the show
     * @param _winnerId ID of the winning contestant
     */
    function endShow(uint256 _showId, uint256 _winnerId) external onlyOwner showExists(_showId) showActive(_showId) validContestant(_showId, _winnerId) {
        require(block.timestamp >= shows[_showId].endTime, "Show has not ended yet");
        require(shows[_showId].totalPrize > 0, "No bets placed on this show");
        
        shows[_showId].isActive = false;
        shows[_showId].isEnded = true;
        shows[_showId].winnerId = _winnerId;
        
        // Calculate platform fee
        uint256 platformFee = (shows[_showId].totalPrize * feePercentage) / 100;
        totalFees += platformFee;
        
        emit ShowEnded(_showId, _winnerId, shows[_showId].totalPrize);
    }
    
    /**
     * @dev Get the winner of a show
     * @param _showId ID of the show
     * @return winnerId ID of the winning contestant
     * @return winnerName Name of the winning contestant
     * @return totalVotes Total votes for the winner
     */
    function getWinnerOfShow(uint256 _showId) external view showExists(_showId) showEnded(_showId) returns (
        uint256 winnerId,
        string memory winnerName,
        uint256 totalVotes
    ) {
        winnerId = shows[_showId].winnerId;
        winnerName = contestants[_showId][winnerId].name;
        totalVotes = shows[_showId].votesPerContestant[winnerId];
    }
    
    /**
     * @dev Redeem prize for a winning bet
     * @param _showId ID of the show
     */
    function redeemPrize(uint256 _showId) external nonReentrant showExists(_showId) showEnded(_showId) {
        require(!shows[_showId].hasRedeemed[msg.sender], "Already redeemed");
        require(shows[_showId].userVotes[msg.sender][shows[_showId].winnerId] > 0, "No winning votes");
        
        uint256 userVotes = shows[_showId].userVotes[msg.sender][shows[_showId].winnerId];
        uint256 totalWinnerVotes = shows[_showId].votesPerContestant[shows[_showId].winnerId];
        uint256 platformFee = (shows[_showId].totalPrize * feePercentage) / 100;
        uint256 netPrize = shows[_showId].totalPrize - platformFee;
        
        // Calculate user's share of the prize
        uint256 userPrize = (netPrize * userVotes) / totalWinnerVotes;
        
        require(userPrize > 0, "No prize to redeem");
        require(address(this).balance >= userPrize, "Insufficient contract balance");
        
        shows[_showId].hasRedeemed[msg.sender] = true;
        
        (bool success, ) = payable(msg.sender).call{value: userPrize}("");
        require(success, "Transfer failed");
        
        emit PrizeRedeemed(_showId, msg.sender, userPrize);
    }
    
    /**
     * @dev Cancel a show and refund all bets
     * @param _showId ID of the show
     */
    function cancelShow(uint256 _showId) external onlyOwner showExists(_showId) showActive(_showId) {
        require(block.timestamp < shows[_showId].endTime, "Cannot cancel ended show");
        
        shows[_showId].isActive = false;
        shows[_showId].isEnded = true;
        
        // Refund all participants
        address[] memory participants = shows[_showId].participants;
        for (uint256 i = 0; i < participants.length; i++) {
            address participant = participants[i];
            uint256 totalRefund = 0;
            
            // Calculate total refund for this participant
            for (uint256 j = 1; j <= contestantCount[_showId]; j++) {
                uint256 userVotes = shows[_showId].userVotes[participant][j];
                totalRefund += userVotes * VOTE_COST;
            }
            
            if (totalRefund > 0) {
                (bool success, ) = payable(participant).call{value: totalRefund}("");
                require(success, "Refund failed");
            }
        }
        
        emit ShowCancelled(_showId, shows[_showId].totalPrize);
    }
    
    /**
     * @dev Get show information
     * @param _showId ID of the show
     */
    function getShowInfo(uint256 _showId) external view showExists(_showId) returns (
        string memory name,
        uint256 endTime,
        bool isActive,
        bool isEnded,
        uint256 totalPrize,
        uint256 participantCount
    ) {
        Show storage show = shows[_showId];
        return (
            show.name,
            show.endTime,
            show.isActive,
            show.isEnded,
            show.totalPrize,
            show.participants.length
        );
    }
    
    /**
     * @dev Get contestant information
     * @param _showId ID of the show
     * @param _contestantId ID of the contestant
     */
    function getContestantInfo(uint256 _showId, uint256 _contestantId) external view showExists(_showId) validContestant(_showId, _contestantId) returns (
        string memory name,
        uint256 totalVotes
    ) {
        return (
            contestants[_showId][_contestantId].name,
            shows[_showId].votesPerContestant[_contestantId]
        );
    }
    
    /**
     * @dev Get user's votes for a specific contestant
     * @param _showId ID of the show
     * @param _contestantId ID of the contestant
     * @param _user User address
     */
    function getUserVotes(uint256 _showId, uint256 _contestantId, address _user) external view showExists(_showId) validContestant(_showId, _contestantId) returns (uint256) {
        return shows[_showId].userVotes[_user][_contestantId];
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
     * @dev Update platform fee percentage (owner only)
     * @param _newFeePercentage New fee percentage (0-10)
     */
    function updateFeePercentage(uint256 _newFeePercentage) external onlyOwner {
        require(_newFeePercentage <= 10, "Fee percentage too high");
        feePercentage = _newFeePercentage;
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
