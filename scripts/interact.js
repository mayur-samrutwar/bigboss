const hre = require("hardhat");

async function main() {
  // Get the contract instance (replace with your deployed contract address)
  const contractAddress = "YOUR_CONTRACT_ADDRESS_HERE";
  const PredictionMarket = await hre.ethers.getContractFactory("PredictionMarket");
  const predictionMarket = PredictionMarket.attach(contractAddress);

  console.log("Interacting with PredictionMarket at:", contractAddress);

  // Example usage:
  try {
    // 1. Create a show (only owner can do this)
    console.log("\n1. Creating a show...");
    const contestantNames = ["Contestant A", "Contestant B", "Contestant C"];
    const duration = 24 * 60 * 60; // 24 hours
    
    const tx1 = await predictionMarket.createShow("Big Boss Show", contestantNames, duration);
    await tx1.wait();
    console.log("Show created successfully!");

    // 2. Get show information
    console.log("\n2. Getting show information...");
    const showInfo = await predictionMarket.getShowInfo(1);
    console.log("Show Info:", {
      name: showInfo.name,
      endTime: new Date(Number(showInfo.endTime) * 1000).toLocaleString(),
      isActive: showInfo.isActive,
      isEnded: showInfo.isEnded,
      totalPrize: hre.ethers.formatEther(showInfo.totalPrize),
      participantCount: showInfo.participantCount.toString()
    });

    // 3. Place bets (users can do this)
    console.log("\n3. Placing bets...");
    const [owner, user1, user2, user3] = await hre.ethers.getSigners();
    
    // User1 bets 2 votes on contestant 1
    const tx2 = await predictionMarket.connect(user1).bet(1, 1, 2, { 
      value: hre.ethers.parseEther("2") 
    });
    await tx2.wait();
    console.log("User1 bet 2 votes on Contestant A");

    // User2 bets 1 vote on contestant 1
    const tx3 = await predictionMarket.connect(user2).bet(1, 1, 1, { 
      value: hre.ethers.parseEther("1") 
    });
    await tx3.wait();
    console.log("User2 bet 1 vote on Contestant A");

    // User3 bets 3 votes on contestant 2
    const tx4 = await predictionMarket.connect(user3).bet(1, 2, 3, { 
      value: hre.ethers.parseEther("3") 
    });
    await tx4.wait();
    console.log("User3 bet 3 votes on Contestant B");

    // 4. Get contestant information
    console.log("\n4. Getting contestant information...");
    for (let i = 1; i <= 3; i++) {
      const contestantInfo = await predictionMarket.getContestantInfo(1, i);
      console.log(`Contestant ${i}:`, {
        name: contestantInfo.name,
        totalVotes: contestantInfo.totalVotes.toString()
      });
    }

    // 5. End the show (only owner can do this)
    console.log("\n5. Ending the show...");
    const tx5 = await predictionMarket.endShow(1, 1); // Contestant 1 wins
    await tx5.wait();
    console.log("Show ended! Contestant A is the winner!");

    // 6. Get winner information
    console.log("\n6. Getting winner information...");
    const winnerInfo = await predictionMarket.getWinnerOfShow(1);
    console.log("Winner Info:", {
      winnerId: winnerInfo.winnerId.toString(),
      winnerName: winnerInfo.winnerName,
      totalVotes: winnerInfo.totalVotes.toString()
    });

    // 7. Redeem prizes
    console.log("\n7. Redeeming prizes...");
    
    // User1 redeems prize
    const tx6 = await predictionMarket.connect(user1).redeemPrize(1);
    const receipt6 = await tx6.wait();
    console.log("User1 redeemed prize");

    // User2 redeems prize
    const tx7 = await predictionMarket.connect(user2).redeemPrize(1);
    const receipt7 = await tx7.wait();
    console.log("User2 redeemed prize");

    // 8. Check contract balance
    console.log("\n8. Contract balance:", 
      hre.ethers.formatEther(await predictionMarket.getContractBalance()), "ETH");

    // 9. Check platform fees
    console.log("\n9. Platform fees:", 
      hre.ethers.formatEther(await predictionMarket.totalFees()), "ETH");

  } catch (error) {
    console.error("Error:", error.message);
  }
}

// Run the interaction
main()
  .then(() => {
    console.log("\nInteraction completed!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Interaction failed:", error);
    process.exit(1);
  });
