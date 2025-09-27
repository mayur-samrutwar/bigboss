import { ethers } from "hardhat";
import fs from "fs";

async function main() {
  console.log("Deploying ShowContract...");

  const ShowContract = await ethers.getContractFactory("ShowContract");
  const showContract = await ShowContract.deploy();
  
  await showContract.waitForDeployment();
  
  const contractAddress = await showContract.getAddress();
  
  console.log("ShowContract deployed to:", contractAddress);
  console.log("Contract owner:", await showContract.owner());
  
  // Get initial show information
  const currentShow = await showContract.getCurrentShow();
  console.log("Initial show ID:", currentShow.showId.toString());
  console.log("Initial show active:", currentShow.isActive);
  console.log("Initial entry fee:", ethers.formatEther(currentShow.entryFee), "ETH");
  
  // Save deployment info
  const deploymentInfo = {
    contractAddress: contractAddress,
    owner: await showContract.owner(),
    deploymentTime: new Date().toISOString(),
    network: "localhost"
  };
  
  fs.writeFileSync('deployment-info.json', JSON.stringify(deploymentInfo, null, 2));
  console.log("Deployment info saved to deployment-info.json");
  
  return showContract;
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
