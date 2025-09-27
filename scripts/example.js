#!/usr/bin/env node

/**
 * Example: How to use the API Scheduler
 * 
 * This script demonstrates different ways to use the API scheduler
 */

const APIScheduler = require('./api-scheduler');

async function exampleUsage() {
  console.log('🚀 API Scheduler Example\n');

  // Create scheduler instance
  const scheduler = new APIScheduler();

  // Show current configuration
  console.log('📋 Current Configuration:');
  console.log(JSON.stringify(scheduler.config, null, 2));
  console.log('\n');

  // Show status before starting
  console.log('📊 Status before starting:');
  console.log(JSON.stringify(scheduler.getStatus(), null, 2));
  console.log('\n');

  // Start the scheduler
  console.log('▶️  Starting scheduler...');
  scheduler.start();

  // Wait a bit to see it running
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Show status after starting
  console.log('📊 Status after starting:');
  console.log(JSON.stringify(scheduler.getStatus(), null, 2));
  console.log('\n');

  // Let it run for a few seconds
  console.log('⏳ Letting scheduler run for 10 seconds...');
  await new Promise(resolve => setTimeout(resolve, 10000));

  // Show final status
  console.log('📊 Final status:');
  console.log(JSON.stringify(scheduler.getStatus(), null, 2));
  console.log('\n');

  // Stop the scheduler
  console.log('🛑 Stopping scheduler...');
  scheduler.stop();

  console.log('✅ Example completed!');
}

// Run the example
exampleUsage().catch(error => {
  console.error('❌ Example failed:', error);
  process.exit(1);
});
