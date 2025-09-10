# TippingPoint Configurator - Infrastructure Requirements

## 📋 Executive Summary

This document outlines the complete infrastructure requirements for deploying the TippingPoint Configurator application on Ubuntu Server 22.04+. The application is a Next.js-based web application with professional-grade security, monitoring, and deployment automation.

## 🏗️ Architecture Overview

```
Internet → Nginx (Reverse Proxy/SSL) → Next.js App (PM2) → File-based Storage
                     ↓
            Security & Monitoring Stack
```

## 💻 Hardware Requirements

### Minimum Requirements (Development/Testing)
- **CPU**: 2 vCPU cores (Intel/AMD x64)
- **RAM**: 4GB DDR4
- **Storage**: 20GB SSD
- **Network**: 100Mbps connection
- **OS**: Ubuntu Server 22.04 LTS or higher

### Recommended Requirements (Production)
- **CPU**: 4+ vCPU cores (Intel/AMD x64)
- **RAM**: 8GB+ DDR4
- **Storage**: 100GB+ SSD with backup storage
- **Network**: 1Gbps+ connection with redundancy
- **OS**: Ubuntu Server 22.04 LTS (latest patches)

### Enterprise Requirements (High Availability)
- **CPU**: 8+ vCPU cores across multiple nodes
- **RAM**: 16GB+ per node
- **Storage**: 500GB+ SSD with RAID 1/10 and separate backup storage
- **Network**: 10Gbps+ with load balancer
- **OS**: Ubuntu Server 22.04 LTS with clustering support

## 🛠️ Software Dependencies

### Core System Requirements
```bash
# Operating System
Ubuntu Server 22.04.3 LTS or higher
Linux Kernel 5.15+ 

# Package Management
APT package manager
Snap package manager (optional)
```

### Required System Packages
```bash
# Build Tools
build-essential
curl
wget
git
software-properties-common
apt-transport-https
ca-certificates
gnupg
lsb-release

# Security Tools
ufw (Uncomplicated Firewall)
fail2ban
unattended-upgrades
rkhunter
chkrootkit
aide
logwatch

# System Utilities
htop
tree
vim
bc
rsync
cron
systemd
```

### Node.js Runtime Environment
```bash
# Node.js (Latest LTS)
Node.js 20.x LTS
npm 10.x+
PM2 5.x+ (Process Manager)

# Installation Method
NodeSource APT Repository (recommended)
```

### Web Server & Reverse Proxy
```bash
# Nginx
nginx 1.18.0+ (Ubuntu 22.04 default)
nginx-extras (optional modules)

# SSL/TLS
Let's Encrypt Certbot
python3-certbot-nginx
```

### Database & Storage
```bash
# File System Requirements
ext4 or xfs file system
JSON file-based storage (no database required)
Automatic backup system included
```

## 🔧 System Configuration

### User Management
```bash
# Application User
Username: deploy
Group: deploy
Home: /home/deploy
Shell: /bin/bash
Sudo Access: Limited (application-specific)

# Service User
Username: www-data (nginx)
Username: deploy (application)
```

### Directory Structure
```
/opt/tippingpointconfigurator/     # Application root
├── .next/                         # Next.js build output
├── src/                          # Source code
├── public/                       # Static assets
├── data/                         # Application data
├── backups/                      # Automatic backups
├── deployment/                   # Deployment configs
├── logs/                        # Application logs
└── node_modules/                # Dependencies

/var/log/tippingpoint-configurator/  # System logs
/var/lib/metrics/                    # Monitoring data
/etc/nginx/sites-available/          # Nginx configs
/etc/systemd/system/                 # Service files
```

### Port Configuration
```bash
# Application Ports
3000  # Next.js application (internal)
80    # HTTP (redirect to HTTPS)
443   # HTTPS (public access)

# Administrative Ports
22    # SSH (secured)
```

### Firewall Rules (UFW)
```bash
# Incoming Rules
22/tcp    # SSH (from specific IPs only)
80/tcp    # HTTP (redirect to HTTPS)
443/tcp   # HTTPS (public)

# Outgoing Rules
53        # DNS
80/443    # HTTP/HTTPS (updates, certbot)
```

## 🔒 Security Requirements

### SSL/TLS Configuration
```bash
# Certificate Authority
Let's Encrypt (automated renewal)
TLS 1.2 and 1.3 only
Strong cipher suites
HSTS headers
```

### Security Hardening
```bash
# System Hardening
SSH key-only authentication
Root login disabled
Fail2Ban intrusion prevention
UFW firewall enabled
Automatic security updates
File integrity monitoring (AIDE)
Rootkit detection (rkhunter)

# Application Security
Input validation (Zod schemas)
CORS protection
Security headers
Rate limiting
Session security
```

### Access Control
```bash
# Administrative Access
SSH key authentication only
Sudo access for deploy user (limited)
Multi-factor authentication (recommended)

# Application Access
Role-based access control
Admin panel restrictions
API rate limiting
```

## 📊 Monitoring & Logging

### System Monitoring
```bash
# Health Checks
Application health endpoint (/api/health)
System resource monitoring
Process monitoring (PM2)
Service availability checks

# Metrics Collection
CPU, Memory, Disk usage
Network statistics
Application performance metrics
Error rates and response times
```

### Logging Infrastructure
```bash
# Log Management
Logrotate for log rotation
Centralized logging (optional)
Log retention policies
Error alerting

# Log Locations
/var/log/tippingpoint-configurator/  # Application logs
/var/log/nginx/                      # Web server logs
/var/log/auth.log                    # Authentication logs
/var/log/syslog                      # System logs
```

### Alerting System
```bash
# Alert Types
Service downtime
High resource usage
Security incidents
SSL certificate expiration
Failed health checks

# Notification Methods
Email alerts (SMTP required)
Log-based monitoring
System notifications
```

## 🚀 Deployment Architecture

### Process Management
```bash
# PM2 Configuration
Cluster mode (multi-process)
Automatic restart on failure
Memory limit monitoring
Log management
Zero-downtime deployment
```

### Load Balancing & High Availability
```bash
# Single Server Setup
Nginx reverse proxy
PM2 cluster mode
Local failover

# Multi-Server Setup (Optional)
External load balancer
Multiple application nodes
Shared storage/database
Session replication
```

### Backup Strategy
```bash
# Automated Backups
Application data (JSON files)
Configuration files
SSL certificates
Log archives

# Backup Storage
Local backup retention (30 days)
Remote backup storage (recommended)
Backup verification and testing
```

## 🔧 Performance Optimization

### Application Performance
```bash
# Next.js Optimizations
Static asset caching
Gzip compression
Image optimization
Code splitting
Tree shaking

# Server Optimizations
Nginx caching
Keep-alive connections
Connection pooling
Memory management
```

### Resource Limits
```bash
# System Limits
File descriptors: 65536
Processes: 4096
Memory per process: 2GB
Network connections: 1024

# Application Limits
PM2 max memory restart: 1GB
Request timeout: 30s
Rate limiting: 100 req/min
```

## 📋 Pre-Deployment Checklist

### Infrastructure Preparation
- [ ] Ubuntu Server 22.04+ installed and updated
- [ ] SSH access configured with key authentication
- [ ] Firewall configured and enabled
- [ ] DNS records pointing to server
- [ ] SSL certificate domain validation ready
- [ ] Backup storage configured
- [ ] Monitoring alerts configured

### Security Preparation
- [ ] Security hardening applied
- [ ] Fail2Ban configured
- [ ] Intrusion detection enabled
- [ ] Log monitoring setup
- [ ] Access controls implemented
- [ ] Security audit completed

### Application Preparation
- [ ] GitHub repository access configured
- [ ] Environment variables defined
- [ ] Email server for notifications
- [ ] Domain name configured
- [ ] SSL certificate obtained
- [ ] Health checks validated

## 🚦 Deployment Process

### Automated Deployment
```bash
# Quick Start (Single Command)
curl -sSL https://raw.githubusercontent.com/tclabsjay/tippingpointconfigurator/main/deployment/scripts/deploy.sh | bash

# Manual Deployment
git clone https://github.com/tclabsjay/tippingpointconfigurator.git
cd tippingpointconfigurator
chmod +x deployment/scripts/deploy.sh
./deployment/scripts/deploy.sh
```

### Post-Deployment Verification
```bash
# Health Checks
curl https://your-domain.com/health
curl https://your-domain.com/api/health

# Service Status
systemctl status tippingpoint-configurator
pm2 status
nginx -t && systemctl status nginx

# Security Verification
ufw status
fail2ban-client status
```

## 📞 Support & Maintenance

### Regular Maintenance Tasks
```bash
# Daily
Health check monitoring
Log review
Backup verification

# Weekly
Security updates
Performance review
Capacity planning

# Monthly
Security audit
Backup testing
Certificate renewal check
```

### Troubleshooting Resources
```bash
# Log Locations
Application: /var/log/tippingpoint-configurator/
System: /var/log/syslog
Web Server: /var/log/nginx/
Security: /var/log/auth.log

# Common Commands
pm2 logs
systemctl status tippingpoint-configurator
nginx -t
ufw status
fail2ban-client status
```

### Contact Information
- **Technical Contact**: Jay Kammerer (jay_kammerer@trendmicro.com)
- **Subject Line**: TippingPoint Configurator Infrastructure
- **Emergency Response**: 24/7 monitoring recommended

---

**Document Version**: 1.3.0  
**Last Updated**: September 5, 2025  
**Next Review**: December 5, 2025
