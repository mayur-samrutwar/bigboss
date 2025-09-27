#!/usr/bin/env node

// Test script for AI Action Integration
const http = require('http');

async function testAiIntegration() {
  console.log('🧪 Testing AI Action Integration...\n');
  
  try {
    // Test 1: Check current show status
    console.log('1️⃣ Checking current show status...');
    const statusResponse = await makeRequest('POST', '/api/comprehensivePoll', {
      showId: '2',
      autoEndShow: false,
      executeAiAction: false
    });
    
    console.log('Status:', statusResponse.status);
    console.log('Message:', statusResponse.message);
    console.log('Is Active:', statusResponse.isActive);
    console.log('Time Remaining:', statusResponse.timeRemaining, 'seconds');
    console.log('Participant Count:', statusResponse.participantCount);
    
    // Test 2: Try AI action polling (decision only)
    if (statusResponse.isActive && statusResponse.participantCount > 0) {
      console.log('\n2️⃣ Testing AI action polling (decision only)...');
      const aiResponse = await makeRequest('POST', '/api/pollAiActions', {
        showId: '2',
        executeAction: false
      });
      
      console.log('AI Response:', aiResponse.message);
      console.log('Action:', aiResponse.action);
      console.log('Alive Count:', aiResponse.aliveCount);
      
      if (aiResponse.aiDecision) {
        console.log('AI Decision:', aiResponse.aiDecision.action);
        console.log('Parameters:', aiResponse.aiDecision.parameters);
      }
    } else {
      console.log('\n2️⃣ Skipping AI test - show not active or no participants');
    }
    
    // Test 3: Test comprehensive polling with AI actions
    console.log('\n3️⃣ Testing comprehensive polling with AI actions...');
    const comprehensiveResponse = await makeRequest('POST', '/api/comprehensivePoll', {
      showId: '2',
      autoEndShow: false,
      executeAiAction: true
    });
    
    console.log('Comprehensive Status:', comprehensiveResponse.status);
    console.log('Message:', comprehensiveResponse.message);
    console.log('Actions Count:', comprehensiveResponse.actions?.length || 0);
    
    if (comprehensiveResponse.actions && comprehensiveResponse.actions.length > 0) {
      comprehensiveResponse.actions.forEach((action, index) => {
        console.log(`  Action ${index + 1}: ${action.type} - ${action.success ? 'Success' : 'Failed'}`);
        if (action.error) {
          console.log(`    Error: ${action.error}`);
        }
        if (action.action) {
          console.log(`    Action: ${action.action}(${action.parameters?.join(', ') || ''})`);
        }
      });
    }
    
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
testAiIntegration();
