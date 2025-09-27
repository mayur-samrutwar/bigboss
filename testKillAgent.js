// Test script for killAgent API
// Usage: node testKillAgent.js

const testKillAgent = async () => {
  const API_URL = 'http://localhost:3000/api/killAgent';
  
  // Test data - replace with actual showId and agentId
  const testData = {
    showId: 1,        // Replace with actual show ID
    agentId: 1        // Replace with actual agent ID
  };

  try {
    console.log('🧪 Testing killAgent API...');
    console.log('📋 Test data:', testData);
    
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    });

    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ Success!');
      console.log('📄 Response:', JSON.stringify(result, null, 2));
    } else {
      console.log('❌ Error!');
      console.log('📄 Error:', JSON.stringify(result, null, 2));
    }
    
  } catch (error) {
    console.error('💥 Network error:', error.message);
  }
};

// Run the test
testKillAgent();
