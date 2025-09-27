#!/usr/bin/env node

// AI Action Polling Script
// This script calls the comprehensive polling API every 3 minutes

const http = require('http');

async function pollAiActions() {
  console.log(`${new Date().toISOString()}: 🤖 Polling AI actions...`);
  
  try {
    // Call the comprehensive polling API
    const response = await makeRequest('POST', '/api/comprehensivePoll', {
      showId: '1', // You can make this dynamic
      autoEndShow: true,  // Auto-end shows when time expires
      executeAiAction: true  // Execute AI actions
    });
    
    console.log(`${new Date().toISOString()}: 📊 Polling result:`, {
      status: response.status,
      message: response.message,
      actions: response.actions?.length || 0
    });
    
    // Log each action result
    if (response.actions && response.actions.length > 0) {
      response.actions.forEach((action, index) => {
        const emoji = action.success ? '✅' : '❌';
        console.log(`  ${emoji} Action ${index + 1}: ${action.type} - ${action.success ? 'Success' : 'Failed'}`);
        if (action.error) {
          console.log(`    Error: ${action.error}`);
        }
        if (action.action) {
          console.log(`    Action: ${action.action}(${action.parameters?.join(', ') || ''})`);
        }
      });
    }
    
    // Check if retry is needed
    const needsRetry = response.actions?.some(action => action.retry);
    if (needsRetry) {
      console.log(`${new Date().toISOString()}: 🔄 Retry needed, will try again in next cycle`);
    }
    
  } catch (error) {
    console.error(`${new Date().toISOString()}: ❌ Polling failed:`, error.message);
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

// Run the polling immediately
pollAiActions();

// Set up interval to run every 3 minutes (180000ms)
setInterval(pollAiActions, 180000);

console.log('🚀 AI Action polling started - polling every 3 minutes');
