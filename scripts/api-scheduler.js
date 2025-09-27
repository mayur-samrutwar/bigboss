#!/usr/bin/env node

/**
 * API Scheduler Script
 * Runs APIs at fixed intervals with configurable schedules
 * 
 * Usage:
 * node scripts/api-scheduler.js
 * 
 * Features:
 * - Configurable API endpoints and intervals
 * - Multiple concurrent schedules
 * - Error handling and retry logic
 * - Detailed logging
 * - Graceful shutdown
 */

const fs = require('fs');
const path = require('path');

// Configuration file path
const CONFIG_FILE = path.join(__dirname, 'api-scheduler-config.json');

// Default configuration
const DEFAULT_CONFIG = {
  baseUrl: 'http://localhost:3000',
  schedules: [
    {
      name: 'show-management',
      interval: 5 * 60 * 1000, // 5 minutes in milliseconds
      enabled: true,
      apiCalls: [
        {
          endpoint: '/api/manageShow',
          method: 'POST',
          body: {
            showId: 1,
            action: 'get_ai_decision'
          },
          retryOnError: true,
          maxRetries: 3
        },
        {
          endpoint: '/api/manageShow',
          method: 'POST',
          body: {
            showId: 1,
            action: 'execute_ai_action'
          },
          retryOnError: true,
          maxRetries: 3
        }
      ]
    },
    {
      name: 'elimination-check',
      interval: 10 * 60 * 1000, // 10 minutes
      enabled: true,
      apiCalls: [
        {
          endpoint: '/api/manageShow',
          method: 'POST',
          body: {
            showId: 1,
            action: 'check_elimination'
          },
          retryOnError: true,
          maxRetries: 2
        }
      ]
    },
    {
      name: 'show-status',
      interval: 2 * 60 * 1000, // 2 minutes
      enabled: true,
      apiCalls: [
        {
          endpoint: '/api/manageShow',
          method: 'POST',
          body: {
            showId: 1,
            action: 'get_show_status'
          },
          retryOnError: false,
          maxRetries: 1
        }
      ]
    }
  ],
  globalSettings: {
    timeout: 30000, // 30 seconds
    logLevel: 'info', // debug, info, warn, error
    saveLogs: true,
    logFile: 'api-scheduler.log'
  }
};

class APIScheduler {
  constructor() {
    this.schedules = new Map();
    this.isRunning = false;
    this.config = null;
    this.logFile = null;
    
    // Load config first
    this.config = this.loadConfig();
    this.logFile = path.join(__dirname, this.config.globalSettings.logFile);
    
    // Setup graceful shutdown
    process.on('SIGINT', () => this.shutdown());
    process.on('SIGTERM', () => this.shutdown());
  }

  loadConfig() {
    try {
      if (fs.existsSync(CONFIG_FILE)) {
        const configData = fs.readFileSync(CONFIG_FILE, 'utf8');
        const config = JSON.parse(configData);
        this.log('info', 'Configuration loaded from file');
        return { ...DEFAULT_CONFIG, ...config };
      } else {
        this.log('info', 'No config file found, creating default configuration');
        this.saveConfig(DEFAULT_CONFIG);
        return DEFAULT_CONFIG;
      }
    } catch (error) {
      this.log('error', `Error loading config: ${error.message}`);
      this.log('info', 'Using default configuration');
      return DEFAULT_CONFIG;
    }
  }

  saveConfig(config) {
    try {
      fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
      this.log('info', 'Configuration saved to file');
    } catch (error) {
      this.log('error', `Error saving config: ${error.message}`);
    }
  }

  log(level, message, data = null) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
    
    // Console output
    if (this.shouldLog(level)) {
      console.log(logMessage);
      if (data) {
        console.log(JSON.stringify(data, null, 2));
      }
    }
    
    // File output
    if (this.config && this.config.globalSettings && this.config.globalSettings.saveLogs && this.logFile) {
      try {
        const fileMessage = data ? `${logMessage}\n${JSON.stringify(data, null, 2)}\n` : `${logMessage}\n`;
        fs.appendFileSync(this.logFile, fileMessage);
      } catch (error) {
        console.error('Error writing to log file:', error.message);
      }
    }
  }

  shouldLog(level) {
    const levels = { debug: 0, info: 1, warn: 2, error: 3 };
    const configLevel = this.config && this.config.globalSettings ? 
      levels[this.config.globalSettings.logLevel] || 1 : 1;
    const messageLevel = levels[level] || 1;
    return messageLevel >= configLevel;
  }

  async makeAPICall(apiCall, scheduleName) {
    const { endpoint, method, body, retryOnError, maxRetries } = apiCall;
    const url = `${this.config.baseUrl}${endpoint}`;
    
    this.log('debug', `Making API call to ${endpoint}`, { scheduleName, method, body });

    let lastError;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.config.globalSettings.timeout);

        const response = await fetch(url, {
          method,
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        
        this.log('info', `API call successful: ${endpoint}`, {
          scheduleName,
          attempt,
          status: response.status,
          response: data
        });

        return { success: true, data, attempt };

      } catch (error) {
        lastError = error;
        
        this.log('warn', `API call failed (attempt ${attempt}/${maxRetries}): ${endpoint}`, {
          scheduleName,
          error: error.message,
          willRetry: attempt < maxRetries && retryOnError
        });

        if (attempt < maxRetries && retryOnError) {
          // Exponential backoff
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
          await this.sleep(delay);
        }
      }
    }

    this.log('error', `API call failed after ${maxRetries} attempts: ${endpoint}`, {
      scheduleName,
      finalError: lastError.message
    });

    return { success: false, error: lastError.message, attempts: maxRetries };
  }

  async executeSchedule(schedule) {
    if (!schedule.enabled) {
      this.log('debug', `Schedule ${schedule.name} is disabled, skipping`);
      return;
    }

    this.log('info', `Executing schedule: ${schedule.name}`);

    const results = [];
    
    for (const apiCall of schedule.apiCalls) {
      const result = await this.makeAPICall(apiCall, schedule.name);
      results.push(result);
    }

    this.log('info', `Schedule ${schedule.name} completed`, {
      totalCalls: schedule.apiCalls.length,
      successfulCalls: results.filter(r => r.success).length,
      failedCalls: results.filter(r => !r.success).length
    });

    return results;
  }

  startSchedule(schedule) {
    if (this.schedules.has(schedule.name)) {
      this.log('warn', `Schedule ${schedule.name} is already running`);
      return;
    }

    this.log('info', `Starting schedule: ${schedule.name} (interval: ${schedule.interval}ms)`);

    const intervalId = setInterval(async () => {
      await this.executeSchedule(schedule);
    }, schedule.interval);

    this.schedules.set(schedule.name, {
      ...schedule,
      intervalId,
      startTime: Date.now(),
      executionCount: 0
    });

    // Execute immediately on start
    this.executeSchedule(schedule).then(() => {
      const scheduleData = this.schedules.get(schedule.name);
      if (scheduleData) {
        scheduleData.executionCount++;
      }
    });
  }

  stopSchedule(scheduleName) {
    const schedule = this.schedules.get(scheduleName);
    if (!schedule) {
      this.log('warn', `Schedule ${scheduleName} not found`);
      return;
    }

    clearInterval(schedule.intervalId);
    this.schedules.delete(scheduleName);
    
    this.log('info', `Stopped schedule: ${scheduleName}`);
  }

  start() {
    if (this.isRunning) {
      this.log('warn', 'Scheduler is already running');
      return;
    }

    this.isRunning = true;
    this.log('info', 'Starting API Scheduler...', {
      baseUrl: this.config.baseUrl,
      schedules: this.config.schedules.length,
      enabledSchedules: this.config.schedules.filter(s => s.enabled).length
    });

    // Start all enabled schedules
    for (const schedule of this.config.schedules) {
      this.startSchedule(schedule);
    }

    this.log('info', 'API Scheduler started successfully');
  }

  stop() {
    if (!this.isRunning) {
      this.log('warn', 'Scheduler is not running');
      return;
    }

    this.log('info', 'Stopping API Scheduler...');

    // Stop all schedules
    for (const scheduleName of this.schedules.keys()) {
      this.stopSchedule(scheduleName);
    }

    this.isRunning = false;
    this.log('info', 'API Scheduler stopped');
  }

  shutdown() {
    this.log('info', 'Shutdown signal received, stopping scheduler...');
    this.stop();
    process.exit(0);
  }

  getStatus() {
    const status = {
      isRunning: this.isRunning,
      schedules: Array.from(this.schedules.values()).map(schedule => ({
        name: schedule.name,
        enabled: schedule.enabled,
        interval: schedule.interval,
        startTime: schedule.startTime,
        executionCount: schedule.executionCount,
        uptime: Date.now() - schedule.startTime
      })),
      config: {
        baseUrl: this.config.baseUrl,
        totalSchedules: this.config.schedules.length,
        enabledSchedules: this.config.schedules.filter(s => s.enabled).length
      }
    };

    return status;
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// CLI Interface
function showHelp() {
  console.log(`
API Scheduler - Run APIs at fixed intervals

Usage:
  node scripts/api-scheduler.js [command]

Commands:
  start     Start the scheduler (default)
  stop      Stop the scheduler
  status    Show scheduler status
  config    Show current configuration
  help      Show this help message

Configuration:
  Edit scripts/api-scheduler-config.json to customize schedules
  Default config will be created on first run

Examples:
  node scripts/api-scheduler.js start
  node scripts/api-scheduler.js status
  node scripts/api-scheduler.js config
`);
}

// Main execution
async function main() {
  const command = process.argv[2] || 'start';
  const scheduler = new APIScheduler();

  switch (command) {
    case 'start':
      scheduler.start();
      break;
      
    case 'stop':
      scheduler.stop();
      break;
      
    case 'status':
      console.log(JSON.stringify(scheduler.getStatus(), null, 2));
      break;
      
    case 'config':
      console.log(JSON.stringify(scheduler.config, null, 2));
      break;
      
    case 'help':
      showHelp();
      break;
      
    default:
      console.error(`Unknown command: ${command}`);
      showHelp();
      process.exit(1);
  }
}

// Run if this file is executed directly
if (require.main === module) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = APIScheduler;
