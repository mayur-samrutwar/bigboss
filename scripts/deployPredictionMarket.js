const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Deploying PredictionMarket contract...");
  
  // Get the contract factory
  const PredictionMarket = await ethers.getContractFactory("PredictionMarket");
  
  // Get the ShowContract address from environment
  const showContractAddress = process.env.SHOW_CONTRACT_ADDRESS || "0xA658D520B9EF89c7996bd6e73c232D0feAa076A4";
  
  console.log(`📋 ShowContract address: ${showContractAddress}`);
  
  // Deploy the contract
  const predictionMarket = await PredictionMarket.deploy(showContractAddress);
  
  // Wait for deployment to complete
  await predictionMarket.waitForDeployment();
  
  const predictionMarketAddress = await predictionMarket.getAddress();
  
  console.log("✅ PredictionMarket deployed successfully!");
  console.log(`📍 Contract address: ${predictionMarketAddress}`);
  console.log(`🔗 ShowContract address: ${showContractAddress}`);
  
  // Verify deployment
  console.log("\n🔍 Verifying deployment...");
  const contractBalance = await predictionMarket.getContractBalance();
  console.log(`💰 Contract balance: ${ethers.formatEther(contractBalance)} ETH`);
  
  const currentShowInfo = await predictionMarket.getCurrentShowInfo();
  console.log(`📺 Current show ID: ${currentShowInfo.showId}`);
  console.log(`📺 Current show name: ${currentShowInfo.name}`);
  console.log(`📺 Current show active: ${currentShowInfo.isActive}`);
  
  console.log("\n🎉 Deployment completed successfully!");
  console.log(`\n📝 Update your .env.local file with:`);
  console.log(`NEXT_PUBLIC_PREDICTION_MARKET_ADDRESS=${predictionMarketAddress}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
