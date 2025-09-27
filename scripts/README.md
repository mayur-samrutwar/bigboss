# API Scheduler

A powerful script to run APIs at fixed intervals with configurable schedules.

## Features

- ⏰ **Configurable Intervals**: Set different intervals for different API calls
- 🔄 **Multiple Schedules**: Run multiple API schedules concurrently
- 🛡️ **Error Handling**: Automatic retry with exponential backoff
- 📝 **Detailed Logging**: Comprehensive logging with different levels
- ⚙️ **Easy Configuration**: JSON-based configuration file
- 🎯 **Flexible API Calls**: Support for different HTTP methods and request bodies
- 🚀 **Graceful Shutdown**: Clean shutdown on SIGINT/SIGTERM

## Quick Start

1. **Start the scheduler:**
   ```bash
   node scripts/api-scheduler.js start
   ```

2. **Or use the simplified command:**
   ```bash
   node scripts/schedule.js start
   ```

3. **Check status:**
   ```bash
   node scripts/schedule.js status
   ```

4. **Stop the scheduler:**
   ```bash
   node scripts/schedule.js stop
   ```

## Configuration

The scheduler uses `scripts/api-scheduler-config.json` for configuration. Here's what you can configure:

### Base Configuration
```json
{
  "baseUrl": "http://localhost:3000",
  "schedules": [...],
  "globalSettings": {
    "timeout": 30000,
    "logLevel": "info",
    "saveLogs": true,
    "logFile": "api-scheduler.log"
  }
}
```

### Schedule Configuration
```json
{
  "name": "show-management",
  "interval": 300000,
  "enabled": true,
  "description": "Runs AI decision and execution every 5 minutes",
  "apiCalls": [
    {
      "endpoint": "/api/manageShow",
      "method": "POST",
      "body": {
        "showId": 1,
        "action": "get_ai_decision"
      },
      "retryOnError": true,
      "maxRetries": 3,
      "description": "Get AI decision for show"
    }
  ]
}
```

## Available Commands

- `start` - Start the scheduler
- `stop` - Stop the scheduler
- `status` - Show current status
- `config` - Show current configuration
- `help` - Show help message

## Example Schedules

### 1. Show Management (Every 5 minutes)
```json
{
  "name": "show-management",
  "interval": 300000,
  "enabled": true,
  "apiCalls": [
    {
      "endpoint": "/api/manageShow",
      "method": "POST",
      "body": {
        "showId": 1,
        "action": "get_ai_decision"
      }
    },
    {
      "endpoint": "/api/manageShow",
      "method": "POST",
      "body": {
        "showId": 1,
        "action": "execute_ai_action"
      }
    }
  ]
}
```

### 2. Elimination Check (Every 10 minutes)
```json
{
  "name": "elimination-check",
  "interval": 600000,
  "enabled": true,
  "apiCalls": [
    {
      "endpoint": "/api/manageShow",
      "method": "POST",
      "body": {
        "showId": 1,
        "action": "check_elimination"
      }
    }
  ]
}
```

### 3. Prize Distribution (Every 30 minutes)
```json
{
  "name": "prize-distribution",
  "interval": 1800000,
  "enabled": false,
  "apiCalls": [
    {
      "endpoint": "/api/prizes/distributeAllPrizes",
      "method": "POST",
      "body": {
        "showId": 1
      }
    }
  ]
}
```

## Logging

The scheduler provides comprehensive logging:

- **Console Output**: Real-time logs in the terminal
- **File Output**: Logs saved to `api-scheduler.log`
- **Log Levels**: `debug`, `info`, `warn`, `error`

### Log Levels
- `debug`: Detailed information for debugging
- `info`: General information about operations
- `warn`: Warning messages for non-critical issues
- `error`: Error messages for failures

## Error Handling

- **Automatic Retry**: Failed API calls are retried with exponential backoff
- **Configurable Retries**: Set `maxRetries` for each API call
- **Timeout Protection**: Requests timeout after specified duration
- **Graceful Degradation**: One failed API call doesn't stop the entire schedule

## Environment Variables

Make sure your environment variables are set:
- `NEXT_PUBLIC_BASE_URL`: Base URL for your API (defaults to `http://localhost:3000`)
- `ADMIN_PRIVATE_KEY`: Required for blockchain operations

## Usage Examples

### Start with specific show ID
1. Edit `scripts/api-scheduler-config.json`
2. Change `showId` in the API call bodies
3. Run: `node scripts/schedule.js start`

### Enable/Disable schedules
1. Edit `scripts/api-scheduler-config.json`
2. Set `enabled: true/false` for each schedule
3. Restart the scheduler

### Custom intervals
- 1 minute: `60000`
- 5 minutes: `300000`
- 10 minutes: `600000`
- 30 minutes: `1800000`
- 1 hour: `3600000`

## Troubleshooting

### Common Issues

1. **API calls failing**
   - Check if your Next.js server is running
   - Verify the `baseUrl` in configuration
   - Check API endpoint paths

2. **Scheduler not starting**
   - Ensure Node.js is installed
   - Check file permissions
   - Verify configuration JSON syntax

3. **Logs not appearing**
   - Check log level setting
   - Verify log file permissions
   - Ensure `saveLogs` is enabled

### Debug Mode
Set log level to `debug` for detailed information:
```json
{
  "globalSettings": {
    "logLevel": "debug"
  }
}
```

## Advanced Usage

### Programmatic Usage
```javascript
const APIScheduler = require('./scripts/api-scheduler');

const scheduler = new APIScheduler();
scheduler.start();

// Get status
const status = scheduler.getStatus();
console.log(status);

// Stop scheduler
scheduler.stop();
```

### Custom API Calls
You can add any API endpoint to your schedules:
```json
{
  "endpoint": "/api/custom-endpoint",
  "method": "POST",
  "body": {
    "customParam": "value"
  },
  "retryOnError": true,
  "maxRetries": 3
}
```

## Contributing

Feel free to extend the scheduler with additional features:
- Webhook notifications
- Database logging
- Web dashboard
- Email alerts
- Metrics collection
