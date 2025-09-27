#!/usr/bin/env node

/**
 * Big Boss Reality Show - API Test Script
 * 
 * This script demonstrates the complete traits and tools system
 * by running a simulated show with AI-driven actions.
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const SHOW_ID = process.env.SHOW_ID || '1';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function makeRequest(endpoint, method = 'GET', body = null) {
  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    log(`❌ Error: ${error.message}`, 'red');
    throw error;
  }
}

async function getShowStatus() {
  log('\n📊 Getting show status...', 'cyan');
  
  const result = await makeRequest('/api/manageShow', 'POST', {
    showId: SHOW_ID,
    action: 'get_show_status'
  });

  if (result.success) {
    log(`\n🎭 Show ${SHOW_ID} Status:`, 'bright');
    log(`   Alive Agents: ${result.result.aliveCount}/${result.result.totalCount}`, 'green');
    
    result.result.agents.forEach(agent => {
      const status = agent.isAlive ? '🟢' : '🔴';
      log(`   ${status} Agent ${agent.agentId} (${agent.name}):`, 'yellow');
      log(`      Popularity: ${agent.traits.popularity} | Risk: ${agent.riskScore}`, 'blue');
    });
  }
  
  return result;
}

async function executeAIAction() {
  log('\n🤖 Getting AI decision and executing...', 'cyan');
  
  const result = await makeRequest('/api/manageShow', 'POST', {
    showId: SHOW_ID,
    action: 'execute_ai_action'
  });

  if (result.success) {
    const action = result.result.aiDecision.action;
    const params = result.result.aiDecision.parameters.join(', ');
    
    log(`\n🎬 AI Action: ${action}(${params})`, 'magenta');
    
    if (result.result.toolResult.traitChanges) {
      log('   Trait Changes:', 'yellow');
      Object.entries(result.result.toolResult.traitChanges).forEach(([agent, changes]) => {
        log(`      Agent ${agent}:`, 'blue');
        Object.entries(changes).forEach(([trait, change]) => {
          log(`        ${trait}: ${change}`, 'green');
        });
      });
    }
  }
  
  return result;
}

async function checkElimination() {
  log('\n🗑️ Checking for elimination...', 'cyan');
  
  const result = await makeRequest('/api/manageShow', 'POST', {
    showId: SHOW_ID,
    action: 'check_elimination'
  });

  if (result.success && result.result.success) {
    const eliminated = result.result.eliminatedAgent;
    log(`\n💀 ELIMINATION: Agent ${eliminated.agentId} (${eliminated.name})`, 'red');
    log(`   Reason: ${result.result.eliminationReason}`, 'yellow');
    log(`   Risk Score: ${eliminated.riskScore}`, 'blue');
  } else {
    log('   No elimination at this time', 'green');
  }
  
  return result;
}

async function runShowSimulation() {
  log('🎭 Big Boss Reality Show - API Test Script', 'bright');
  log('==========================================', 'bright');
  
  try {
    // Initial status
    await getShowStatus();
    
    // Run 5 AI actions
    for (let i = 1; i <= 5; i++) {
      log(`\n🔄 Round ${i}/5`, 'bright');
      await executeAIAction();
      
      // Check elimination every 2 rounds
      if (i % 2 === 0) {
        await checkElimination();
      }
      
      // Wait 2 seconds between actions
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    // Final status
    log('\n🏁 Final Show Status:', 'bright');
    await getShowStatus();
    
    log('\n✅ Simulation completed successfully!', 'green');
    
  } catch (error) {
    log(`\n❌ Simulation failed: ${error.message}`, 'red');
    process.exit(1);
  }
}

// Run the simulation
if (require.main === module) {
  runShowSimulation();
}

module.exports = {
  makeRequest,
  getShowStatus,
  executeAIAction,
  checkElimination,
  runShowSimulation
};
