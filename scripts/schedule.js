#!/usr/bin/env node

/**
 * API Scheduler Manager
 * Simple utility to manage the API scheduler
 */

const { spawn } = require('child_process');
const path = require('path');

const SCHEDULER_SCRIPT = path.join(__dirname, 'api-scheduler.js');

function runCommand(command, args = []) {
  return new Promise((resolve, reject) => {
    const child = spawn('node', [SCHEDULER_SCRIPT, command, ...args], {
      stdio: 'inherit',
      cwd: process.cwd()
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Command failed with code ${code}`));
      }
    });

    child.on('error', reject);
  });
}

async function main() {
  const command = process.argv[2] || 'start';

  try {
    switch (command) {
      case 'start':
        console.log('🚀 Starting API Scheduler...');
        await runCommand('start');
        break;

      case 'stop':
        console.log('🛑 Stopping API Scheduler...');
        await runCommand('stop');
        break;

      case 'status':
        console.log('📊 API Scheduler Status:');
        await runCommand('status');
        break;

      case 'config':
        console.log('⚙️  Current Configuration:');
        await runCommand('config');
        break;

      case 'help':
        await runCommand('help');
        break;

      default:
        console.log(`❌ Unknown command: ${command}`);
        console.log('Available commands: start, stop, status, config, help');
        process.exit(1);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();
