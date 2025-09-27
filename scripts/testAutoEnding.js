#!/usr/bin/env node

// Test script for automatic show ending
const http = require('http');

async function testAutoEnding() {
  console.log('🧪 Testing automatic show ending system...\n');
  
  try {
    // Test 1: Check current show status
    console.log('1️⃣ Checking current show status...');
    const statusResponse = await makeRequest('POST', '/api/pollCheckStatus', {
      showId: '1',
      autoProcess: false // Just check, don't auto-end
    });
    
    console.log('Status:', statusResponse.status);
    console.log('Reason:', statusResponse.reason);
    console.log('Time Remaining:', statusResponse.showInfo.timeRemaining, 'seconds');
    console.log('Is Active:', statusResponse.showInfo.isActive);
    console.log('Alive Count:', statusResponse.showInfo.aliveCount);
    
    // Test 2: Try auto-ending if conditions are met
    if (statusResponse.showInfo.timeRemaining <= 0 && statusResponse.showInfo.isActive) {
      console.log('\n2️⃣ Attempting to auto-end show...');
      const autoEndResponse = await makeRequest('POST', '/api/pollCheckStatus', {
        showId: '1',
        autoProcess: true // Enable auto-ending
      });
      
      console.log('Auto-end Status:', autoEndResponse.status);
      console.log('Auto-end Reason:', autoEndResponse.reason);
      
      if (autoEndResponse.autoEndResult) {
        console.log('Auto-end Result:', autoEndResponse.autoEndResult);
        if (autoEndResponse.autoEndResult.success) {
          console.log('✅ Show auto-ended successfully!');
          console.log('Transaction Hash:', autoEndResponse.autoEndResult.transactionHash);
        } else {
          console.log('❌ Auto-end failed:', autoEndResponse.autoEndResult.error);
        }
      }
    } else {
      console.log('\n2️⃣ Show not ready for auto-ending');
      console.log('   - Time remaining:', statusResponse.showInfo.timeRemaining);
      console.log('   - Is active:', statusResponse.showInfo.isActive);
    }
    
    // Test 3: Check status after auto-ending
    console.log('\n3️⃣ Checking status after auto-ending...');
    const finalResponse = await makeRequest('POST', '/api/pollCheckStatus', {
      showId: '1',
      autoProcess: false
    });
    
    console.log('Final Status:', finalResponse.status);
    console.log('Final Reason:', finalResponse.reason);
    console.log('Is Active:', finalResponse.showInfo.isActive);
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

function makeRequest(method, path, data) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(data);
    
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };
    
    const req = http.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsed = JSON.parse(responseData);
          resolve(parsed);
        } catch (error) {
          reject(new Error('Invalid JSON response'));
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    req.write(postData);
    req.end();
  });
}

// Run the test
testAutoEnding();
