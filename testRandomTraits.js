// Test script to verify random trait generation
const { ethers } = require('ethers');
const { SHOW_CONTRACT_ABI, SHOW_CONTRACT_ADDRESS } = require('./abi/ShowContract.js');

async function testRandomTraits() {
  try {
    // Set up provider
    const provider = new ethers.JsonRpcProvider('https://testnet.evm.nodes.onflow.org');
    const contract = new ethers.Contract(SHOW_CONTRACT_ADDRESS, SHOW_CONTRACT_ABI, provider);

    console.log('Testing random trait generation...\n');

    // Test multiple agents to see trait variation
    for (let i = 1; i <= 3; i++) {
      try {
        const agentInfo = await contract.getAgentInfo(BigInt(i));
        
        if (agentInfo.agentId.toString() === i.toString()) {
          const traits = {
            popularity: agentInfo.parameters[0],
            aggression: agentInfo.parameters[1],
            loyalty: agentInfo.parameters[2],
            resilience: agentInfo.parameters[3],
            charisma: agentInfo.parameters[4],
            suspicion: agentInfo.parameters[5],
            energy: agentInfo.parameters[6]
          };

          console.log(`Agent ${i} (${agentInfo.name}):`);
          console.log(`  Popularity: ${traits.popularity} (range: 30-80)`);
          console.log(`  Aggression: ${traits.aggression} (range: 20-70)`);
          console.log(`  Loyalty: ${traits.loyalty} (range: 40-90)`);
          console.log(`  Resilience: ${traits.resilience} (range: 30-85)`);
          console.log(`  Charisma: ${traits.charisma} (range: 25-90)`);
          console.log(`  Suspicion: ${traits.suspicion} (range: 10-60)`);
          console.log(`  Energy: ${traits.energy} (range: 60-100)`);
          
          // Calculate risk score
          const riskScore = (traits.suspicion + traits.aggression) - (traits.popularity + traits.charisma + traits.resilience);
          console.log(`  Risk Score: ${riskScore}`);
          console.log('');
        }
      } catch (error) {
        console.log(`Agent ${i} not found or error: ${error.message}`);
      }
    }

    console.log('Random trait generation test completed!');
    console.log('\nTo test with new agents:');
    console.log('1. Go to /register page');
    console.log('2. Connect wallet');
    console.log('3. Create new agents');
    console.log('4. Run this script again');

  } catch (error) {
    console.error('Error testing random traits:', error);
  }
}

// Run the test
testRandomTraits();
