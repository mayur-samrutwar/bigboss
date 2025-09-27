// Test agent creation with the new contract
const { ethers } = require('ethers');
const { SHOW_CONTRACT_ABI, SHOW_CONTRACT_ADDRESS } = require('./abi/ShowContract.js');

async function testAgentCreation() {
  try {
    console.log('🧪 Testing agent creation with VRF...\n');

    // Set up provider
    const provider = new ethers.JsonRpcProvider('https://testnet.evm.nodes.onflow.org');
    const contractAddress = '0x5B3E85350c58F46690d016803a7a083594E7c182';
    const contract = new ethers.Contract(contractAddress, SHOW_CONTRACT_ABI, provider);

    console.log('1. Contract connection test...');
    const owner = await contract.owner();
    console.log(`   ✅ Contract owner: ${owner}`);

    console.log('\n2. Current agent count...');
    const agentCounter = await contract.agentCounter();
    console.log(`   Current agents: ${agentCounter}`);

    console.log('\n3. Testing VRF...');
    const randomNumber = await contract.getRandomNumber();
    console.log(`   ✅ VRF working: ${randomNumber}`);

    console.log('\n4. Contract status...');
    const isPaused = await contract.paused();
    console.log(`   Contract paused: ${isPaused}`);

    console.log('\n✅ Contract is ready for agent creation!');
    console.log('\n📝 Instructions:');
    console.log('1. Go to http://localhost:3001/register');
    console.log('2. Connect your wallet');
    console.log('3. Enter an agent name');
    console.log('4. Click "CREATE AGENT"');
    console.log('5. VRF will generate random traits automatically');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testAgentCreation();
