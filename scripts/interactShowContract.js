import { ethers } from "hardhat";
import fs from "fs";

async function main() {
  // Get the contract address from deployment
  let deploymentInfo;
  try {
    deploymentInfo = JSON.parse(fs.readFileSync('deployment-info.json', 'utf8'));
  } catch (error) {
    console.log("Please deploy the contract first by running: npx hardhat run scripts/deployShowContract.js --network localhost");
    return;
  }

  const contractAddress = deploymentInfo.contractAddress;
  console.log("Interacting with ShowContract at:", contractAddress);

  // Get signers
  const [owner, user1, user2, user3, aiAddress] = await ethers.getSigners();
  
  // Connect to the contract
  const ShowContract = await ethers.getContractFactory("ShowContract");
  const showContract = ShowContract.attach(contractAddress);

  console.log("\n=== ShowContract Interaction Demo ===\n");

  try {
    // 1. Check current show
    console.log("1. Checking current show...");
    const currentShow = await showContract.getCurrentShow();
    console.log("Current Show ID:", currentShow.showId.toString());
    console.log("Is Active:", currentShow.isActive);
    console.log("Entry Fee:", ethers.formatEther(currentShow.entryFee), "ETH");
    console.log("Time until end:", (await showContract.getTimeUntilShowEnds()).toString(), "seconds");

    // 2. Register agents
    console.log("\n2. Registering agents...");
    
    const agent1Params = [100, 200, 300];
    const agent2Params = [150, 250, 350];
    const agent3Params = [200, 300, 400];

    await showContract.connect(user1).registerAgent("Agent1", agent1Params);
    console.log("✓ Agent1 registered by user1");

    await showContract.connect(user2).registerAgent("Agent2", agent2Params);
    console.log("✓ Agent2 registered by user2");

    await showContract.connect(user3).registerAgent("Agent3", agent3Params);
    console.log("✓ Agent3 registered by user3");

    // 3. Authorize AI
    console.log("\n3. Authorizing AI...");
    await showContract.authorizeAI(aiAddress.address);
    console.log("✓ AI address authorized:", aiAddress.address);

    // 4. Participate in show
    console.log("\n4. Participating in show...");
    const entryFee = ethers.parseEther("0.01");
    
    await showContract.connect(user1).participateInShow(1, 1, { value: entryFee });
    console.log("✓ Agent1 participated in show");

    await showContract.connect(user2).participateInShow(1, 2, { value: entryFee });
    console.log("✓ Agent2 participated in show");

    await showContract.connect(user3).participateInShow(1, 3, { value: entryFee });
    console.log("✓ Agent3 participated in show");

    // 5. Vote for agents
    console.log("\n5. Voting for agents...");
    const voteFee = ethers.parseEther("0.01");
    
    await showContract.connect(owner).voteForAgent(1, 1, { value: voteFee });
    console.log("✓ Owner voted for Agent1");

    await showContract.connect(owner).voteForAgent(1, 2, { value: voteFee });
    console.log("✓ Owner voted for Agent2");

    await showContract.connect(owner).voteForAgent(1, 1, { value: voteFee });
    console.log("✓ Owner voted for Agent1 again");

    // 6. AI updates agent parameters
    console.log("\n6. AI updating agent parameters...");
    const newParams = [180, 280, 380];
    await showContract.connect(aiAddress).updateAgentParams(1, newParams);
    console.log("✓ AI updated Agent1 parameters");

    // 7. AI kills an agent
    console.log("\n7. AI killing an agent...");
    await showContract.connect(aiAddress).killAgent(1, 3);
    console.log("✓ AI killed Agent3");

    // 8. Check show participants
    console.log("\n8. Checking show participants...");
    const participants = await showContract.getShowParticipants(1);
    console.log("Participating Agent IDs:", participants.agentIds.map(id => id.toString()));
    console.log("Participant addresses:", participants.participantAddresses);

    // 9. Fast forward time to end the show
    console.log("\n9. Fast forwarding time to end show...");
    await ethers.provider.send("evm_increaseTime", [12 * 60 * 60]); // 12 hours
    await ethers.provider.send("evm_mine");
    console.log("✓ Time fast forwarded by 12 hours");

    // 10. End the show
    console.log("\n10. Ending the show...");
    await showContract.endShow(1);
    console.log("✓ Show ended");

    // 11. Get winner information
    console.log("\n11. Getting winner information...");
    const winnerInfo = await showContract.getWinnerOfShow(1);
    console.log("Winner Agent ID:", winnerInfo.winnerAgentId.toString());
    console.log("Winner Name:", winnerInfo.winnerName);
    console.log("Total Votes:", winnerInfo.totalVotes.toString());
    console.log("Prize Amount:", ethers.formatEther(winnerInfo.prizeAmount), "ETH");

    // 12. Claim prize
    console.log("\n12. Claiming prize...");
    const winnerOwner = winnerInfo.winnerAgentId.toString() === "1" ? user1 : 
                       winnerInfo.winnerAgentId.toString() === "2" ? user2 : user3;
    
    const initialBalance = await ethers.provider.getBalance(winnerOwner.address);
    await showContract.connect(winnerOwner).claimPrize(1);
    const finalBalance = await ethers.provider.getBalance(winnerOwner.address);
    
    console.log("✓ Prize claimed by winner");
    console.log("Prize amount:", ethers.formatEther(finalBalance - initialBalance), "ETH");

    // 13. Check platform fees
    console.log("\n13. Checking platform fees...");
    const platformFees = await showContract.totalPlatformFees();
    console.log("Total platform fees:", ethers.formatEther(platformFees), "ETH");

    // 14. Start new show
    console.log("\n14. Starting new show...");
    await showContract.startShow();
    const newShow = await showContract.getCurrentShow();
    console.log("✓ New show started with ID:", newShow.showId.toString());

    // 15. Update entry fee for new show
    console.log("\n15. Updating entry fee...");
    const newEntryFee = ethers.parseEther("0.02");
    await showContract.updateEntryFee(newEntryFee);
    console.log("✓ Entry fee updated to:", ethers.formatEther(newEntryFee), "ETH");

    console.log("\n=== Demo completed successfully! ===");
    console.log("\nContract functions tested:");
    console.log("✓ Agent registration");
    console.log("✓ Show participation");
    console.log("✓ Voting system");
    console.log("✓ AI parameter updates");
    console.log("✓ AI agent killing");
    console.log("✓ Show ending");
    console.log("✓ Prize claiming");
    console.log("✓ Platform fee collection");
    console.log("✓ New show creation");
    console.log("✓ Entry fee management");

  } catch (error) {
    console.error("Error during interaction:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
