# 🚀 API Scheduler - Complete Solution

I've created a comprehensive API scheduler system that allows you to run APIs at fixed intervals. Here's what you now have:

## 📁 Files Created

1. **`scripts/api-scheduler.js`** - Main scheduler script with full functionality
2. **`scripts/api-scheduler-config.json`** - Configuration file for schedules
3. **`scripts/schedule.js`** - Simplified command-line interface
4. **`scripts/example.js`** - Example usage demonstration
5. **`scripts/README.md`** - Comprehensive documentation

## 🎯 Key Features

- ⏰ **Configurable Intervals**: Set different intervals for different API calls
- 🔄 **Multiple Schedules**: Run multiple API schedules concurrently
- 🛡️ **Error Handling**: Automatic retry with exponential backoff
- 📝 **Detailed Logging**: Comprehensive logging with different levels
- ⚙️ **Easy Configuration**: JSON-based configuration file
- 🎯 **Flexible API Calls**: Support for different HTTP methods and request bodies
- 🚀 **Graceful Shutdown**: Clean shutdown on SIGINT/SIGTERM

## 🚀 Quick Start

### Method 1: Using npm scripts (Recommended)
```bash
# Start the scheduler
npm run schedule:start

# Check status
npm run schedule:status

# Stop the scheduler
npm run schedule:stop

# View configuration
npm run schedule:config
```

### Method 2: Direct script execution
```bash
# Start the scheduler
node scripts/schedule.js start

# Check status
node scripts/schedule.js status

# Stop the scheduler
node scripts/schedule.js stop
```

## ⚙️ Configuration

The scheduler is configured via `scripts/api-scheduler-config.json`. Here's what's currently set up:

### Current Schedules:

1. **Show Management** (Every 5 minutes)
   - Gets AI decision
   - Executes AI action

2. **Elimination Check** (Every 10 minutes)
   - Checks if elimination is needed

3. **Show Status** (Every 2 minutes)
   - Gets current show status

4. **Prize Distribution** (Every 30 minutes - DISABLED)
   - Distributes prizes (disabled by default)

## 🔧 Customization

### Change Intervals
Edit `scripts/api-scheduler-config.json`:
```json
{
  "interval": 300000  // 5 minutes in milliseconds
}
```

### Add New API Calls
Add to the `apiCalls` array:
```json
{
  "endpoint": "/api/your-endpoint",
  "method": "POST",
  "body": {
    "yourParam": "value"
  },
  "retryOnError": true,
  "maxRetries": 3
}
```

### Enable/Disable Schedules
```json
{
  "enabled": true  // or false to disable
}
```

## 📊 Monitoring

### View Logs
- **Console**: Real-time logs in terminal
- **File**: Logs saved to `scripts/api-scheduler.log`

### Check Status
```bash
npm run schedule:status
```

### Log Levels
- `debug`: Detailed debugging info
- `info`: General information (default)
- `warn`: Warning messages
- `error`: Error messages only

## 🎯 Example Usage Scenarios

### Scenario 1: Basic Show Management
```bash
# Start scheduler for show management
npm run schedule:start

# Monitor in another terminal
npm run schedule:status
```

### Scenario 2: Custom Show ID
1. Edit `scripts/api-scheduler-config.json`
2. Change `showId` from `1` to your desired show ID
3. Restart scheduler

### Scenario 3: Different Intervals
- **Fast updates**: 1 minute (60000ms)
- **Normal updates**: 5 minutes (300000ms)
- **Slow updates**: 30 minutes (1800000ms)

## 🛠️ Advanced Features

### Error Handling
- Automatic retry with exponential backoff
- Configurable retry limits
- Timeout protection
- Graceful degradation

### Multiple Concurrent Schedules
- Each schedule runs independently
- Different intervals for different purposes
- Individual enable/disable controls

### Programmatic Usage
```javascript
const APIScheduler = require('./scripts/api-scheduler');

const scheduler = new APIScheduler();
scheduler.start();

// Get status
const status = scheduler.getStatus();

// Stop scheduler
scheduler.stop();
```

## 🔍 Troubleshooting

### Common Issues

1. **API calls failing**
   - Ensure your Next.js server is running (`npm run dev`)
   - Check the `baseUrl` in configuration
   - Verify API endpoint paths

2. **Scheduler not starting**
   - Check Node.js installation
   - Verify file permissions
   - Check configuration JSON syntax

3. **Logs not appearing**
   - Check log level setting
   - Verify log file permissions
   - Ensure `saveLogs` is enabled

### Debug Mode
Set log level to `debug` in configuration:
```json
{
  "globalSettings": {
    "logLevel": "debug"
  }
}
```

## 📈 Next Steps

1. **Start the scheduler**: `npm run schedule:start`
2. **Monitor logs**: Check console output and log file
3. **Customize intervals**: Edit configuration as needed
4. **Add more APIs**: Extend schedules with additional endpoints

## 🎉 You're All Set!

Your API scheduler is ready to use. It will automatically call your APIs at the configured intervals, handle errors gracefully, and provide detailed logging. The system is designed to be robust and production-ready.

**Start it now with**: `npm run schedule:start`
