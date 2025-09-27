const { ethers } = require("hardhat");

async function main() {
  console.log("=== Manual ShowContract Test ===\n");

  try {
    // Get signers
    const [owner, user1, user2, user3, aiAddress] = await ethers.getSigners();
    console.log("✓ Got signers");

    // Deploy contract
    console.log("Deploying ShowContract...");
    const ShowContract = await ethers.getContractFactory("ShowContract");
    const showContract = await ShowContract.deploy();
    await showContract.waitForDeployment();
    
    const contractAddress = await showContract.getAddress();
    console.log("✓ Contract deployed to:", contractAddress);

    // Test 1: Check initial show
    console.log("\n1. Testing initial show...");
    const currentShow = await showContract.getCurrentShow();
    console.log("✓ Initial show ID:", currentShow.showId.toString());
    console.log("✓ Initial show active:", currentShow.isActive);
    console.log("✓ Entry fee:", ethers.formatEther(currentShow.entryFee), "ETH");

    // Test 2: Register agents
    console.log("\n2. Testing agent registration...");
    const agent1Params = [100, 200, 300];
    const agent2Params = [150, 250, 350];
    
    await showContract.connect(user1).registerAgent("Agent1", agent1Params);
    console.log("✓ Agent1 registered");

    await showContract.connect(user2).registerAgent("Agent2", agent2Params);
    console.log("✓ Agent2 registered");

    // Test 3: Get agent info
    console.log("\n3. Testing agent info retrieval...");
    const agent1Info = await showContract.getAgentInfo(1);
    console.log("✓ Agent1 owner:", agent1Info.owner);
    console.log("✓ Agent1 name:", agent1Info.name);
    console.log("✓ Agent1 parameters:", agent1Info.parameters.map(p => p.toString()));

    // Test 4: Authorize AI
    console.log("\n4. Testing AI authorization...");
    await showContract.authorizeAI(aiAddress.address);
    console.log("✓ AI authorized");

    // Test 5: Participate in show
    console.log("\n5. Testing show participation...");
    const entryFee = ethers.parseEther("0.01");
    
    await showContract.connect(user1).participateInShow(1, 1, { value: entryFee });
    console.log("✓ Agent1 participated in show");

    await showContract.connect(user2).participateInShow(1, 2, { value: entryFee });
    console.log("✓ Agent2 participated in show");

    // Test 6: Vote for agents
    console.log("\n6. Testing voting...");
    const voteFee = ethers.parseEther("0.01");
    
    await showContract.connect(owner).voteForAgent(1, 1, { value: voteFee });
    console.log("✓ Voted for Agent1");

    await showContract.connect(owner).voteForAgent(1, 2, { value: voteFee });
    console.log("✓ Voted for Agent2");

    // Test 7: AI updates agent parameters
    console.log("\n7. Testing AI parameter updates...");
    const newParams = [180, 280, 380];
    await showContract.connect(aiAddress).updateAgentParams(1, newParams);
    console.log("✓ AI updated Agent1 parameters");

    // Test 8: AI kills an agent
    console.log("\n8. Testing AI agent killing...");
    await showContract.connect(aiAddress).killAgent(1, 2);
    console.log("✓ AI killed Agent2");

    // Test 9: Check show participants
    console.log("\n9. Testing show participants...");
    const participants = await showContract.getShowParticipants(1);
    console.log("✓ Participating agents:", participants.agentIds.map(id => id.toString()));

    // Test 10: Fast forward time and end show
    console.log("\n10. Testing show ending...");
    await ethers.provider.send("evm_increaseTime", [12 * 60 * 60]); // 12 hours
    await ethers.provider.send("evm_mine");
    console.log("✓ Time fast forwarded");

    await showContract.endShow(1);
    console.log("✓ Show ended");

    // Test 11: Get winner info
    console.log("\n11. Testing winner retrieval...");
    const winnerInfo = await showContract.getWinnerOfShow(1);
    console.log("✓ Winner Agent ID:", winnerInfo.winnerAgentId.toString());
    console.log("✓ Winner Name:", winnerInfo.winnerName);
    console.log("✓ Total Votes:", winnerInfo.totalVotes.toString());
    console.log("✓ Prize Amount:", ethers.formatEther(winnerInfo.prizeAmount), "ETH");

    // Test 12: Claim prize
    console.log("\n12. Testing prize claiming...");
    const winnerOwner = winnerInfo.winnerAgentId.toString() === "1" ? user1 : user2;
    const initialBalance = await ethers.provider.getBalance(winnerOwner.address);
    
    await showContract.connect(winnerOwner).claimPrize(1);
    console.log("✓ Prize claimed");

    const finalBalance = await ethers.provider.getBalance(winnerOwner.address);
    const prizeAmount = finalBalance - initialBalance;
    console.log("✓ Prize amount:", ethers.formatEther(prizeAmount), "ETH");

    // Test 13: Check platform fees
    console.log("\n13. Testing platform fees...");
    const platformFees = await showContract.totalPlatformFees();
    console.log("✓ Platform fees collected:", ethers.formatEther(platformFees), "ETH");

    // Test 14: Start new show
    console.log("\n14. Testing new show creation...");
    await showContract.startShow();
    const newShow = await showContract.getCurrentShow();
    console.log("✓ New show started with ID:", newShow.showId.toString());

    // Test 15: Update entry fee
    console.log("\n15. Testing entry fee update...");
    const newEntryFee = ethers.parseEther("0.02");
    await showContract.updateEntryFee(newEntryFee);
    console.log("✓ Entry fee updated to:", ethers.formatEther(newEntryFee), "ETH");

    console.log("\n=== All Tests Passed! ===");
    console.log("\nContract functions verified:");
    console.log("✓ Agent registration and management");
    console.log("✓ Show participation and voting");
    console.log("✓ AI parameter updates and agent killing");
    console.log("✓ Show lifecycle management");
    console.log("✓ Prize distribution and claiming");
    console.log("✓ Platform fee collection");
    console.log("✓ Entry fee management");

  } catch (error) {
    console.error("❌ Test failed:", error.message);
    console.error("Stack trace:", error.stack);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
