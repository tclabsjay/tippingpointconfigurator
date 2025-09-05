#!/bin/bash
# TippingPoint Configurator - Security Hardening Script
# Ubuntu Server 22.04+ Security Best Practices
# Author: Infrastructure Security Team

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

# System hardening
harden_system() {
    log "Applying system security hardening..."
    
    # Update system
    sudo apt update && sudo apt upgrade -y
    
    # Install security packages
    sudo apt install -y \
        fail2ban \
        ufw \
        unattended-upgrades \
        apt-listchanges \
        rkhunter \
        chkrootkit \
        lynis \
        aide \
        logwatch
    
    # Configure automatic security updates
    sudo dpkg-reconfigure -plow unattended-upgrades
    
    log "System hardening completed"
}

# Configure Fail2Ban
configure_fail2ban() {
    log "Configuring Fail2Ban..."
    
    # Create custom jail configuration
    sudo tee /etc/fail2ban/jail.local > /dev/null << 'EOF'
[DEFAULT]
# Ban IP for 1 hour
bantime = 3600
# Find 5 failures in 10 minutes
findtime = 600
maxretry = 5
# Email notifications
destemail = admin@your-domain.com
sender = fail2ban@your-domain.com
action = %(action_mwl)s

[sshd]
enabled = true
port = ssh
filter = sshd
logpath = /var/log/auth.log
maxretry = 3

[nginx-http-auth]
enabled = true
filter = nginx-http-auth
port = http,https
logpath = /var/log/nginx/error.log

[nginx-limit-req]
enabled = true
filter = nginx-limit-req
port = http,https
logpath = /var/log/nginx/error.log
maxretry = 10

[nginx-botsearch]
enabled = true
filter = nginx-botsearch
port = http,https
logpath = /var/log/nginx/access.log
maxretry = 2
EOF

    # Create custom filters
    sudo tee /etc/fail2ban/filter.d/nginx-limit-req.conf > /dev/null << 'EOF'
[Definition]
failregex = limiting requests, excess: .* by zone .*, client: <HOST>
ignoreregex =
EOF

    sudo tee /etc/fail2ban/filter.d/nginx-botsearch.conf > /dev/null << 'EOF'
[Definition]
failregex = <HOST> .* "(GET|POST) .*(wp-|admin|phpmyadmin|\.php|\.asp|\.exe|\.pl|\.cgi|\.scr)"
ignoreregex =
EOF

    # Start and enable Fail2Ban
    sudo systemctl enable fail2ban
    sudo systemctl restart fail2ban
    
    log "Fail2Ban configured successfully"
}

# SSH hardening
harden_ssh() {
    log "Hardening SSH configuration..."
    
    # Backup original config
    sudo cp /etc/ssh/sshd_config /etc/ssh/sshd_config.backup
    
    # Apply SSH hardening
    sudo tee /etc/ssh/sshd_config.d/99-hardening.conf > /dev/null << 'EOF'
# SSH Hardening Configuration
Protocol 2
Port 22

# Authentication
PermitRootLogin no
PasswordAuthentication no
PubkeyAuthentication yes
AuthorizedKeysFile .ssh/authorized_keys
PermitEmptyPasswords no
ChallengeResponseAuthentication no
UsePAM yes

# Security settings
AllowUsers deploy
MaxAuthTries 3
MaxSessions 2
ClientAliveInterval 300
ClientAliveCountMax 2
LoginGraceTime 60
MaxStartups 2

# Disable unused features
AllowAgentForwarding no
AllowTcpForwarding no
X11Forwarding no
PrintMotd no
PrintLastLog yes
TCPKeepAlive yes
Compression no
UseDNS no

# Logging
SyslogFacility AUTH
LogLevel INFO
EOF

    # Test SSH configuration
    sudo sshd -t
    
    # Restart SSH service
    sudo systemctl restart sshd
    
    log "SSH hardening completed"
}

# Kernel hardening
harden_kernel() {
    log "Applying kernel hardening..."
    
    # Create sysctl hardening configuration
    sudo tee /etc/sysctl.d/99-security.conf > /dev/null << 'EOF'
# Network security
net.ipv4.ip_forward = 0
net.ipv4.conf.all.send_redirects = 0
net.ipv4.conf.default.send_redirects = 0
net.ipv4.conf.all.accept_redirects = 0
net.ipv4.conf.default.accept_redirects = 0
net.ipv4.conf.all.accept_source_route = 0
net.ipv4.conf.default.accept_source_route = 0
net.ipv4.conf.all.log_martians = 1
net.ipv4.conf.default.log_martians = 1
net.ipv4.icmp_echo_ignore_broadcasts = 1
net.ipv4.icmp_ignore_bogus_error_responses = 1
net.ipv4.tcp_syncookies = 1
net.ipv4.tcp_max_syn_backlog = 2048
net.ipv4.tcp_synack_retries = 2
net.ipv4.tcp_syn_retries = 5

# IPv6 security
net.ipv6.conf.all.accept_redirects = 0
net.ipv6.conf.default.accept_redirects = 0
net.ipv6.conf.all.accept_source_route = 0
net.ipv6.conf.default.accept_source_route = 0

# Memory protection
kernel.dmesg_restrict = 1
kernel.kptr_restrict = 2
kernel.yama.ptrace_scope = 1
kernel.kexec_load_disabled = 1

# File system security
fs.suid_dumpable = 0
fs.protected_hardlinks = 1
fs.protected_symlinks = 1
EOF

    # Apply sysctl settings
    sudo sysctl -p /etc/sysctl.d/99-security.conf
    
    log "Kernel hardening completed"
}

# File system permissions
secure_file_permissions() {
    log "Securing file system permissions..."
    
    # Secure sensitive files
    sudo chmod 600 /etc/ssh/sshd_config
    sudo chmod 644 /etc/passwd
    sudo chmod 644 /etc/group
    sudo chmod 600 /etc/shadow
    sudo chmod 600 /etc/gshadow
    
    # Secure application files
    sudo chown -R deploy:deploy /opt/tippingpointconfigurator
    sudo chmod -R 755 /opt/tippingpointconfigurator
    sudo chmod 600 /opt/tippingpointconfigurator/.env.local 2>/dev/null || true
    
    # Secure log files
    sudo chmod 640 /var/log/auth.log
    sudo chmod 640 /var/log/syslog
    
    log "File permissions secured"
}

# Configure log monitoring
setup_log_monitoring() {
    log "Setting up log monitoring..."
    
    # Install and configure logwatch
    sudo apt install -y logwatch
    
    # Configure logwatch
    sudo tee /etc/logwatch/conf/logwatch.conf > /dev/null << 'EOF'
LogDir = /var/log
TmpDir = /var/cache/logwatch
MailTo = admin@your-domain.com
MailFrom = logwatch@your-domain.com
Print = Yes
Save = /var/cache/logwatch
Range = yesterday
Detail = Med
Service = All
mailer = "/usr/sbin/sendmail -t"
EOF

    # Setup daily logwatch cron
    sudo tee /etc/cron.daily/00logwatch > /dev/null << 'EOF'
#!/bin/bash
/usr/sbin/logwatch --output mail --mailto admin@your-domain.com --detail high
EOF
    sudo chmod +x /etc/cron.daily/00logwatch
    
    log "Log monitoring configured"
}

# Configure intrusion detection
setup_intrusion_detection() {
    log "Setting up intrusion detection..."
    
    # Configure AIDE
    sudo aideinit
    sudo mv /var/lib/aide/aide.db.new /var/lib/aide/aide.db
    
    # Create AIDE check script
    sudo tee /etc/cron.daily/aide-check > /dev/null << 'EOF'
#!/bin/bash
aide --check | mail -s "AIDE Report $(hostname)" admin@your-domain.com
EOF
    sudo chmod +x /etc/cron.daily/aide-check
    
    # Configure rkhunter
    sudo rkhunter --update
    sudo rkhunter --propupd
    
    # Create rkhunter check script
    sudo tee /etc/cron.daily/rkhunter-check > /dev/null << 'EOF'
#!/bin/bash
rkhunter --cronjob --report-warnings-only | mail -s "rkhunter Report $(hostname)" admin@your-domain.com
EOF
    sudo chmod +x /etc/cron.daily/rkhunter-check
    
    log "Intrusion detection configured"
}

# Security audit
security_audit() {
    log "Running security audit..."
    
    # Run Lynis audit
    sudo lynis audit system --quick
    
    # Generate security report
    REPORT_FILE="/tmp/security-audit-$(date +%Y%m%d-%H%M%S).txt"
    
    {
        echo "TippingPoint Configurator Security Audit Report"
        echo "Generated: $(date)"
        echo "=========================================="
        echo
        echo "System Information:"
        uname -a
        echo
        echo "Listening Ports:"
        sudo netstat -tlnp
        echo
        echo "Running Services:"
        sudo systemctl list-units --type=service --state=running
        echo
        echo "Failed Login Attempts:"
        sudo grep "Failed password" /var/log/auth.log | tail -10
        echo
        echo "Fail2Ban Status:"
        sudo fail2ban-client status
        echo
        echo "Firewall Status:"
        sudo ufw status verbose
        echo
    } > "$REPORT_FILE"
    
    info "Security audit report saved to: $REPORT_FILE"
    
    log "Security audit completed"
}

# Main function
main() {
    log "Starting security hardening for TippingPoint Configurator..."
    
    if [[ $EUID -eq 0 ]]; then
        error "This script should not be run as root"
        exit 1
    fi
    
    harden_system
    configure_fail2ban
    harden_ssh
    harden_kernel
    secure_file_permissions
    setup_log_monitoring
    setup_intrusion_detection
    security_audit
    
    log "Security hardening completed successfully!"
    warning "Remember to:"
    warning "1. Update email addresses in configuration files"
    warning "2. Review and test all security settings"
    warning "3. Setup proper SSH key authentication"
    warning "4. Configure monitoring alerts"
    warning "5. Regularly update the system and review logs"
}

main "$@"
