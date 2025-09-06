# TippingPoint Configurator - Application Management Scripts

Professional, visually appealing scripts for managing the TippingPoint Configurator application with comprehensive status reporting and error handling.

## 🚀 Available Scripts

### Interactive Manager (Recommended)
```bash
./scripts/app-manager.sh
```
**Interactive menu-driven application manager with real-time status updates**

- ✅ Real-time application status monitoring
- 🎯 Context-aware menu options
- 📊 Health check integration
- 📝 Log viewing capabilities
- 🔄 All management functions in one interface

### Individual Management Scripts

#### Start Application
```bash
./scripts/app-start.sh
```
**Professional application startup with comprehensive checks**

- 🔍 Pre-flight system validation
- 🧹 Automatic cleanup of existing processes
- 📦 Dependency verification and installation
- 🚀 Graceful application launch
- ⏱️ Health check monitoring
- 📊 Performance metrics display

#### Stop Application
```bash
./scripts/app-stop.sh
```
**Graceful application shutdown with cleanup**

- 🔍 Process identification and status reporting
- 🛑 Graceful shutdown (SIGTERM) attempt
- 💀 Force kill (SIGKILL) if needed
- 🧹 Complete resource cleanup
- 📝 Log archival with timestamps
- ✅ Final verification

#### Restart Application
```bash
./scripts/app-restart.sh
```
**Zero-downtime application restart**

- 📊 Pre-restart statistics collection
- 🛑 Graceful stop via stop script
- 🚀 Fresh start via start script
- 📊 Post-restart performance comparison
- ✅ End-to-end verification

## 🎨 Visual Features

### Color-Coded Output
- 🟢 **Green**: Success messages and healthy status
- 🔴 **Red**: Errors and stopped states
- 🟡 **Yellow**: Warnings and in-progress actions
- 🔵 **Blue**: Information and system details
- 🟣 **Purple**: Application branding and headers

### Progress Indicators
- ⚙️ **Animated Spinners**: For long-running operations
- ⏱️ **Countdown Timers**: For timed operations
- 📊 **Progress Steps**: Clear step-by-step execution
- ✅ **Status Indicators**: Real-time operation feedback

### Professional Banners
```
╔══════════════════════════════════════════════════════════════════╗
║                    TIPPINGPOINT CONFIGURATOR                     ║
║                        Application Starter                       ║
║                           Version 1.1                            ║
╚══════════════════════════════════════════════════════════════════╝
```

## 🔧 Technical Features

### Comprehensive Error Handling
- **Process Detection**: Identifies all related processes
- **Port Management**: Handles port conflicts automatically
- **Graceful Degradation**: Falls back to alternative methods
- **Resource Cleanup**: Ensures clean system state

### Health Monitoring Integration
- **Real-time Health Checks**: `/api/health` endpoint monitoring
- **Performance Metrics**: Memory usage, uptime tracking
- **Status Verification**: Multi-layer application status checking
- **Automatic Recovery**: Intelligent restart capabilities

### Log Management
- **Automatic Archival**: Timestamped log preservation
- **Real-time Viewing**: Live log monitoring capabilities
- **Historical Access**: Easy access to previous sessions
- **Structured Logging**: Clear, searchable log formats

## 📋 Usage Examples

### Quick Start
```bash
# Start the application
./scripts/app-start.sh

# Check if it's running (interactive)
./scripts/app-manager.sh

# Restart for updates
./scripts/app-restart.sh

# Stop when done
./scripts/app-stop.sh
```

### Development Workflow
```bash
# Interactive management (recommended for development)
./scripts/app-manager.sh
# Then use menu options: 1) Start, 2) Restart, 3) Stop, 4) View Logs
```

### Production Deployment
```bash
# Automated startup (for systemd or cron)
./scripts/app-start.sh

# Automated restart (for maintenance)
./scripts/app-restart.sh

# Graceful shutdown (for maintenance)
./scripts/app-stop.sh
```

## 🔍 Troubleshooting

### Common Issues

#### Port Already in Use
```bash
# The scripts automatically handle this:
# 1. Detect port conflicts
# 2. Identify conflicting processes
# 3. Gracefully terminate them
# 4. Clean up resources
# 5. Proceed with operation
```

#### Application Won't Start
```bash
# Check the detailed logs:
tail -f /tmp/tippingpoint-app.log

# Or use the manager for guided troubleshooting:
./scripts/app-manager.sh
```

#### Health Checks Failing
```bash
# The scripts provide detailed health information:
# - Memory usage monitoring
# - Response time tracking
# - API endpoint verification
# - Process status checking
```

### Log Locations
- **Current Logs**: `/tmp/tippingpoint-app.log`
- **Archived Logs**: `/tmp/tippingpoint-app-YYYYMMDD-HHMMSS.log`
- **System Integration**: Compatible with systemd journaling

## 🛡️ Security Features

### Process Isolation
- **User Permissions**: Runs with appropriate user privileges
- **Resource Limits**: Prevents resource exhaustion
- **Clean Shutdown**: Ensures no orphaned processes

### Safe Operations
- **Validation Checks**: Verifies system state before operations
- **Rollback Capability**: Can recover from failed operations
- **Audit Trail**: Complete logging of all management actions

## 🚀 Integration

### Systemd Integration
```bash
# The scripts are compatible with systemd services
# See deployment/systemd/ for service files
```

### CI/CD Integration
```bash
# Automated deployment pipelines can use:
./scripts/app-start.sh   # For deployments
./scripts/app-restart.sh # For updates
./scripts/app-stop.sh    # For maintenance
```

### Monitoring Integration
```bash
# Scripts provide structured output for monitoring systems
# Health checks return JSON data for external monitoring
curl http://localhost:3000/api/health
```

---

**Version**: 1.1  
**Compatibility**: macOS, Linux (Ubuntu 22.04+)  
**Dependencies**: bash, curl, jq (optional), lsof  
**Author**: TippingPoint Configurator Team

