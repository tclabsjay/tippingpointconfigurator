#!/bin/bash
# TippingPoint Configurator - Monitoring and Logging Setup
# Ubuntu Server 22.04+ Monitoring Stack
# Author: Infrastructure Monitoring Team

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() { echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1" >&2; }
warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
info() { echo -e "${BLUE}[INFO]${NC} $1"; }

APP_NAME="tippingpoint-configurator"
APP_DIR="/opt/tippingpointconfigurator"
LOG_DIR="/var/log/$APP_NAME"
METRICS_DIR="/var/lib/metrics"

# Create monitoring directories
create_directories() {
    log "Creating monitoring directories..."
    
    sudo mkdir -p $LOG_DIR
    sudo mkdir -p $METRICS_DIR
    sudo mkdir -p /etc/monitoring
    sudo mkdir -p /var/lib/health-checks
    
    sudo chown deploy:deploy $LOG_DIR
    sudo chown deploy:deploy $METRICS_DIR
    
    log "Monitoring directories created"
}

# Setup application health checks
setup_health_checks() {
    log "Setting up health checks..."
    
    # Create health check script
    sudo tee /usr/local/bin/health-check-tippingpoint.sh > /dev/null << 'EOF'
#!/bin/bash
# TippingPoint Configurator Health Check

APP_URL="http://localhost:3000"
HEALTH_ENDPOINT="$APP_URL/health"
LOG_FILE="/var/log/tippingpoint-configurator/health-check.log"
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

# Function to log with timestamp
log_health() {
    echo "[$TIMESTAMP] $1" >> $LOG_FILE
}

# Check application health
check_app_health() {
    if curl -f -s -m 10 $HEALTH_ENDPOINT > /dev/null 2>&1; then
        log_health "OK: Application health check passed"
        echo "healthy"
        return 0
    else
        log_health "CRITICAL: Application health check failed"
        echo "unhealthy"
        return 1
    fi
}

# Check PM2 processes
check_pm2_status() {
    if sudo -u deploy pm2 list | grep -q "online"; then
        log_health "OK: PM2 processes are running"
        return 0
    else
        log_health "CRITICAL: PM2 processes are not running"
        return 1
    fi
}

# Check disk space
check_disk_space() {
    USAGE=$(df /opt | tail -1 | awk '{print $5}' | sed 's/%//')
    if [ $USAGE -lt 85 ]; then
        log_health "OK: Disk usage is $USAGE%"
        return 0
    else
        log_health "WARNING: Disk usage is high: $USAGE%"
        return 1
    fi
}

# Check memory usage
check_memory() {
    MEMORY_USAGE=$(free | grep Mem | awk '{printf "%.0f", $3/$2 * 100.0}')
    if [ $MEMORY_USAGE -lt 90 ]; then
        log_health "OK: Memory usage is $MEMORY_USAGE%"
        return 0
    else
        log_health "WARNING: Memory usage is high: $MEMORY_USAGE%"
        return 1
    fi
}

# Main health check
main() {
    log_health "Starting health check"
    
    HEALTH_STATUS="healthy"
    
    if ! check_app_health; then
        HEALTH_STATUS="unhealthy"
    fi
    
    if ! check_pm2_status; then
        HEALTH_STATUS="unhealthy"
    fi
    
    if ! check_disk_space; then
        HEALTH_STATUS="warning"
    fi
    
    if ! check_memory; then
        HEALTH_STATUS="warning"
    fi
    
    log_health "Health check completed: $HEALTH_STATUS"
    echo $HEALTH_STATUS
}

main "$@"
EOF

    sudo chmod +x /usr/local/bin/health-check-tippingpoint.sh
    
    # Create systemd timer for health checks
    sudo tee /etc/systemd/system/tippingpoint-health-check.service > /dev/null << 'EOF'
[Unit]
Description=TippingPoint Configurator Health Check
After=network.target

[Service]
Type=oneshot
ExecStart=/usr/local/bin/health-check-tippingpoint.sh
User=root
StandardOutput=journal
StandardError=journal
EOF

    sudo tee /etc/systemd/system/tippingpoint-health-check.timer > /dev/null << 'EOF'
[Unit]
Description=Run TippingPoint health check every 5 minutes
Requires=tippingpoint-health-check.service

[Timer]
OnCalendar=*:0/5
Persistent=true

[Install]
WantedBy=timers.target
EOF

    sudo systemctl daemon-reload
    sudo systemctl enable tippingpoint-health-check.timer
    sudo systemctl start tippingpoint-health-check.timer
    
    log "Health checks configured"
}

# Setup system metrics collection
setup_metrics_collection() {
    log "Setting up metrics collection..."
    
    # Create metrics collection script
    sudo tee /usr/local/bin/collect-metrics.sh > /dev/null << 'EOF'
#!/bin/bash
# System Metrics Collection for TippingPoint Configurator

METRICS_FILE="/var/lib/metrics/system-metrics-$(date +%Y%m%d).json"
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

# Collect system metrics
collect_system_metrics() {
    CPU_USAGE=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | sed 's/%us,//')
    MEMORY_TOTAL=$(free -m | awk 'NR==2{print $2}')
    MEMORY_USED=$(free -m | awk 'NR==2{print $3}')
    MEMORY_PERCENT=$(free | grep Mem | awk '{printf "%.2f", $3/$2 * 100.0}')
    DISK_USAGE=$(df /opt | tail -1 | awk '{print $5}' | sed 's/%//')
    LOAD_AVG=$(uptime | awk -F'load average:' '{print $2}' | sed 's/,//g' | xargs)
    
    # Network metrics
    RX_BYTES=$(cat /proc/net/dev | grep eth0 | awk '{print $2}' || echo "0")
    TX_BYTES=$(cat /proc/net/dev | grep eth0 | awk '{print $10}' || echo "0")
    
    # Application metrics
    PM2_PROCESSES=$(sudo -u deploy pm2 list | grep -c "online" || echo "0")
    NGINX_CONNECTIONS=$(ss -tuln | grep -c ":80\|:443" || echo "0")
    
    # Create JSON metrics
    cat > $METRICS_FILE << EOF
{
  "timestamp": "$TIMESTAMP",
  "system": {
    "cpu_usage_percent": $CPU_USAGE,
    "memory_total_mb": $MEMORY_TOTAL,
    "memory_used_mb": $MEMORY_USED,
    "memory_usage_percent": $MEMORY_PERCENT,
    "disk_usage_percent": $DISK_USAGE,
    "load_average": "$LOAD_AVG",
    "network_rx_bytes": $RX_BYTES,
    "network_tx_bytes": $TX_BYTES
  },
  "application": {
    "pm2_processes": $PM2_PROCESSES,
    "nginx_connections": $NGINX_CONNECTIONS,
    "uptime_seconds": $(cat /proc/uptime | awk '{print int($1)}')
  }
}
EOF
}

collect_system_metrics
EOF

    sudo chmod +x /usr/local/bin/collect-metrics.sh
    
    # Create cron job for metrics collection
    echo "*/5 * * * * /usr/local/bin/collect-metrics.sh" | sudo crontab -
    
    log "Metrics collection configured"
}

# Setup log rotation and management
setup_log_management() {
    log "Setting up log management..."
    
    # Configure logrotate for application logs
    sudo tee /etc/logrotate.d/tippingpoint-configurator > /dev/null << 'EOF'
/var/log/tippingpoint-configurator/*.log {
    daily
    rotate 30
    compress
    delaycompress
    missingok
    notifempty
    create 644 deploy deploy
    postrotate
        sudo -u deploy pm2 reloadLogs
    endscript
}

/var/log/nginx/tippingpoint-configurator.*.log {
    daily
    rotate 30
    compress
    delaycompress
    missingok
    notifempty
    create 644 www-data www-data
    postrotate
        systemctl reload nginx
    endscript
}

/var/lib/metrics/*.json {
    daily
    rotate 90
    compress
    delaycompress
    missingok
    notifempty
    create 644 deploy deploy
}
EOF

    # Setup PM2 log rotation
    sudo -u deploy pm2 install pm2-logrotate
    sudo -u deploy pm2 set pm2-logrotate:max_size 10M
    sudo -u deploy pm2 set pm2-logrotate:retain 30
    sudo -u deploy pm2 set pm2-logrotate:compress true
    
    log "Log management configured"
}

# Setup alerting system
setup_alerting() {
    log "Setting up alerting system..."
    
    # Create alert script
    sudo tee /usr/local/bin/alert-manager.sh > /dev/null << 'EOF'
#!/bin/bash
# Alert Manager for TippingPoint Configurator

ALERT_EMAIL="admin@your-domain.com"
APP_NAME="TippingPoint Configurator"
HOSTNAME=$(hostname)

send_alert() {
    local SEVERITY=$1
    local MESSAGE=$2
    local SUBJECT="[$SEVERITY] $APP_NAME Alert - $HOSTNAME"
    
    {
        echo "Alert Details:"
        echo "=============="
        echo "Timestamp: $(date)"
        echo "Hostname: $HOSTNAME"
        echo "Severity: $SEVERITY"
        echo "Message: $MESSAGE"
        echo ""
        echo "System Status:"
        echo "=============="
        echo "Uptime: $(uptime)"
        echo "Load Average: $(uptime | awk -F'load average:' '{print $2}')"
        echo "Memory Usage: $(free -h)"
        echo "Disk Usage: $(df -h /opt)"
        echo ""
        echo "Application Status:"
        echo "=================="
        sudo -u deploy pm2 list
        echo ""
        echo "Recent Logs:"
        echo "============"
        tail -20 /var/log/tippingpoint-configurator/error.log 2>/dev/null || echo "No error logs found"
    } | mail -s "$SUBJECT" $ALERT_EMAIL
}

# Check for critical conditions
check_critical_conditions() {
    # Check if application is down
    if ! curl -f -s -m 10 http://localhost:3000/health > /dev/null 2>&1; then
        send_alert "CRITICAL" "Application health check failed - service may be down"
    fi
    
    # Check disk space
    DISK_USAGE=$(df /opt | tail -1 | awk '{print $5}' | sed 's/%//')
    if [ $DISK_USAGE -gt 90 ]; then
        send_alert "CRITICAL" "Disk usage is critically high: $DISK_USAGE%"
    fi
    
    # Check memory usage
    MEMORY_USAGE=$(free | grep Mem | awk '{printf "%.0f", $3/$2 * 100.0}')
    if [ $MEMORY_USAGE -gt 95 ]; then
        send_alert "CRITICAL" "Memory usage is critically high: $MEMORY_USAGE%"
    fi
}

case "$1" in
    "check")
        check_critical_conditions
        ;;
    "send")
        send_alert "$2" "$3"
        ;;
    *)
        echo "Usage: $0 {check|send <severity> <message>}"
        exit 1
        ;;
esac
EOF

    sudo chmod +x /usr/local/bin/alert-manager.sh
    
    # Create cron job for alert checks
    echo "*/10 * * * * /usr/local/bin/alert-manager.sh check" | sudo crontab -
    
    log "Alerting system configured"
}

# Setup monitoring dashboard data
setup_dashboard_data() {
    log "Setting up monitoring dashboard data..."
    
    # Create dashboard data generator
    sudo tee /usr/local/bin/generate-dashboard-data.sh > /dev/null << 'EOF'
#!/bin/bash
# Generate monitoring dashboard data

DASHBOARD_FILE="/var/lib/metrics/dashboard-data.json"
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

# Collect comprehensive metrics
{
    echo "{"
    echo "  \"timestamp\": \"$TIMESTAMP\","
    echo "  \"status\": \"$(curl -f -s -m 5 http://localhost:3000/health > /dev/null 2>&1 && echo 'healthy' || echo 'unhealthy')\","
    echo "  \"uptime\": $(cat /proc/uptime | awk '{print int($1)}'),
    echo "  \"system\": {"
    echo "    \"cpu_usage\": $(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | sed 's/%us,//'),
    echo "    \"memory_usage\": $(free | grep Mem | awk '{printf "%.2f", $3/$2 * 100.0}'),
    echo "    \"disk_usage\": $(df /opt | tail -1 | awk '{print $5}' | sed 's/%//'),
    echo "    \"load_average\": \"$(uptime | awk -F'load average:' '{print $2}' | xargs)\""
    echo "  },"
    echo "  \"application\": {"
    echo "    \"pm2_processes\": $(sudo -u deploy pm2 list | grep -c "online" || echo "0"),
    echo "    \"nginx_status\": \"$(systemctl is-active nginx)\","
    echo "    \"ssl_cert_expiry\": \"$(openssl x509 -enddate -noout -in /etc/letsencrypt/live/your-domain.com/cert.pem 2>/dev/null | cut -d= -f2 || echo 'N/A')\""
    echo "  },"
    echo "  \"logs\": {"
    echo "    \"error_count_24h\": $(grep -c "ERROR" /var/log/tippingpoint-configurator/*.log 2>/dev/null | awk -F: '{sum += $2} END {print sum+0}'),
    echo "    \"warning_count_24h\": $(grep -c "WARNING" /var/log/tippingpoint-configurator/*.log 2>/dev/null | awk -F: '{sum += $2} END {print sum+0}')"
    echo "  }"
    echo "}"
} > $DASHBOARD_FILE

chown deploy:deploy $DASHBOARD_FILE
EOF

    sudo chmod +x /usr/local/bin/generate-dashboard-data.sh
    
    # Create cron job for dashboard data
    echo "* * * * * /usr/local/bin/generate-dashboard-data.sh" | sudo crontab -
    
    log "Dashboard data generation configured"
}

# Main function
main() {
    log "Setting up monitoring and logging for TippingPoint Configurator..."
    
    if [[ $EUID -eq 0 ]]; then
        error "This script should not be run as root"
        exit 1
    fi
    
    create_directories
    setup_health_checks
    setup_metrics_collection
    setup_log_management
    setup_alerting
    setup_dashboard_data
    
    log "Monitoring and logging setup completed successfully!"
    
    info "Monitoring Components Installed:"
    info "- Health checks (every 5 minutes)"
    info "- System metrics collection (every 5 minutes)"
    info "- Log rotation and management"
    info "- Email alerting system (every 10 minutes)"
    info "- Dashboard data generation (every minute)"
    
    warning "Remember to:"
    warning "1. Update email addresses in alert configurations"
    warning "2. Configure mail server for notifications"
    warning "3. Test all monitoring components"
    warning "4. Setup external monitoring if required"
    warning "5. Review and adjust alert thresholds"
}

main "$@"
