const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Starting ShowContract deployment...");
  
  // Get the contract factory
  const ShowContract = await ethers.getContractFactory("ShowContract");
  
  console.log("📋 Contract details:");
  console.log("- Contract name: ShowContract");
  console.log("- Network: Flow Testnet");
  console.log("- Chain ID: 545");
  
  // Deploy the contract
  console.log("\n⏳ Deploying contract...");
  const showContract = await ShowContract.deploy();
  
  console.log("⏳ Waiting for deployment to be mined...");
  await showContract.waitForDeployment();
  
  // Get the deployed contract address
  const contractAddress = await showContract.getAddress();
  
  console.log("\n✅ Deployment successful!");
  console.log("📄 Contract deployed to:", contractAddress);
  console.log("🔗 Flow Testnet Explorer: https://testnet.flowscan.org/address/" + contractAddress);
  
  // Verify deployment by calling some view functions
  console.log("\n🔍 Verifying deployment...");
  try {
    const owner = await showContract.owner();
    const currentShowId = await showContract.currentShowId();
    const showDuration = await showContract.SHOW_DURATION();
    const maxParticipants = await showContract.MAX_PARTICIPANTS_PER_SHOW();
    const platformFee = await showContract.PLATFORM_FEE_PERCENTAGE();
    const voteFee = await showContract.VOTE_FEE();
    
    console.log("✅ Contract verification successful!");
    console.log("👤 Owner:", owner);
    console.log("🎬 Current Show ID:", currentShowId.toString());
    console.log("⏰ Show Duration:", showDuration.toString(), "seconds");
    console.log("👥 Max Participants:", maxParticipants.toString());
    console.log("💰 Platform Fee:", platformFee.toString(), "%");
    console.log("🗳️ Vote Fee:", ethers.formatEther(voteFee), "ETH");
    
  } catch (error) {
    console.log("⚠️ Warning: Could not verify contract functions:", error.message);
  }
  
  // Get owner for deployment info
  const owner = await showContract.owner();
  
  // Save deployment info
  const deploymentInfo = {
    contractAddress: contractAddress,
    network: "flowTestnet",
    chainId: 545,
    deployer: owner,
    deploymentTime: new Date().toISOString(),
    contractName: "ShowContract"
  };
  
  console.log("\n📝 Deployment Summary:");
  console.log(JSON.stringify(deploymentInfo, null, 2));
  
  console.log("\n🔧 Next steps:");
  console.log("1. Update NEXT_PUBLIC_CONTRACT_ADDRESS in your .env file:");
  console.log(`   NEXT_PUBLIC_CONTRACT_ADDRESS=${contractAddress}`);
  console.log("2. Restart your Next.js development server");
  console.log("3. Test the admin panel with the deployed contract");
  
  console.log("\n🎉 Deployment completed successfully!");
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:");
    console.error(error);
    process.exit(1);
  });