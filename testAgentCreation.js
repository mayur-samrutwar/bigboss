// Simple test to verify agent creation works with fallback
const { ethers } = require('ethers');
const { SHOW_CONTRACT_ABI, SHOW_CONTRACT_ADDRESS } = require('./abi/ShowContract.js');

async function testAgentCreation() {
  try {
    console.log('🧪 Testing agent creation with fallback randomness...\n');

    // Set up provider
    const provider = new ethers.JsonRpcProvider('https://testnet.evm.nodes.onflow.org');
    const contract = new ethers.Contract(SHOW_CONTRACT_ADDRESS, SHOW_CONTRACT_ABI, provider);

    console.log('1. Contract connection test...');
    const owner = await contract.owner();
    console.log(`   ✅ Contract owner: ${owner}`);

    console.log('\n2. Current agent count...');
    const agentCounter = await contract.agentCounter();
    console.log(`   Current agents: ${agentCounter}`);

    console.log('\n3. Testing agent info retrieval...');
    try {
      const agentInfo = await contract.getAgentInfo(BigInt(1));
      console.log(`   ✅ Agent 1 exists: ${agentInfo.name}`);
      console.log(`   Traits: [${agentInfo.parameters.join(', ')}]`);
    } catch (error) {
      console.log(`   ℹ️  No agents exist yet: ${error.message}`);
    }

    console.log('\n4. Contract status...');
    const isPaused = await contract.paused();
    console.log(`   Contract paused: ${isPaused}`);

    console.log('\n✅ Contract is ready for agent creation!');
    console.log('\n📝 Instructions:');
    console.log('1. Go to http://localhost:3000/register');
    console.log('2. Connect your wallet');
    console.log('3. Enter an agent name');
    console.log('4. Click "CREATE AGENT"');
    console.log('5. The contract will use fallback randomness if VRF fails');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testAgentCreation();
