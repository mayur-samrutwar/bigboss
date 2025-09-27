// Debug script to test VRF functionality
const { ethers } = require('ethers');
const { SHOW_CONTRACT_ABI, SHOW_CONTRACT_ADDRESS } = require('./abi/ShowContract.js');

async function debugVRF() {
  try {
    console.log('🔍 Debugging VRF functionality...\n');

    // Set up provider
    const provider = new ethers.JsonRpcProvider('https://testnet.evm.nodes.onflow.org');
    const contractAddress = '0x5B3E85350c58F46690d016803a7a083594E7c182'; // New contract address
    const contract = new ethers.Contract(contractAddress, SHOW_CONTRACT_ABI, provider);

    console.log('1. Testing contract connection...');
    const owner = await contract.owner();
    console.log(`   ✅ Contract owner: ${owner}`);

    console.log('\n2. Testing Cadence Arch address...');
    try {
      const cadenceArchAddress = await contract.cadenceArch();
      console.log(`   Cadence Arch: ${cadenceArchAddress}`);
      
      if (cadenceArchAddress === '0x0000000000000000000000010000000000000001') {
        console.log('   ✅ Correct Cadence Arch address');
      } else {
        console.log('   ❌ Wrong Cadence Arch address');
      }
    } catch (error) {
      console.log(`   ❌ Cannot access cadenceArch: ${error.message}`);
    }

    console.log('\n3. Testing VRF call directly...');
    try {
      const [success, data] = await contract.testVRF();
      console.log(`   VRF call success: ${success}`);
      console.log(`   Data length: ${data.length}`);
      
      if (success && data.length > 0) {
        const randomNumber = ethers.getBigInt(data);
        console.log(`   ✅ Random number: ${randomNumber}`);
      } else {
        console.log('   ❌ VRF call failed or returned empty data');
        if (data.length > 0) {
          console.log(`   Error data: ${data}`);
        }
      }
    } catch (error) {
      console.log(`   ❌ VRF test failed: ${error.message}`);
    }

    console.log('\n4. Testing agent creation with fallback...');
    console.log('   Try creating an agent now - it should work with fallback randomness');

    console.log('\n5. Network information...');
    const network = await provider.getNetwork();
    console.log(`   Network: ${network.name} (${network.chainId})`);
    console.log(`   RPC URL: https://testnet.evm.nodes.onflow.org`);

  } catch (error) {
    console.error('❌ Debug failed:', error.message);
  }
}

// Run the debug
debugVRF();
