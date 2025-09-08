# TippingPoint Configurator - Deployment Guide

## 🚀 Quick Deployment (Ubuntu Server 22.04+)

### One-Line Deployment
```bash
curl -sSL https://raw.githubusercontent.com/tclabsjay/tippingpointconfigurator/main/deployment/scripts/deploy.sh | bash
```

## 📋 Pre-Deployment Requirements

### 1. System Requirements
- **OS**: Ubuntu Server 22.04 LTS or higher
- **CPU**: 2+ vCPU cores (4+ recommended for production)
- **RAM**: 4GB minimum (8GB+ recommended for production)
- **Storage**: 20GB minimum (100GB+ recommended for production)
- **Network**: Stable internet connection with domain name

### 2. Access Requirements
- **SSH Access**: Root or sudo user access
- **Domain Name**: DNS pointing to your server
- **Email**: SMTP server for notifications (optional but recommended)

### 3. Security Preparation
- **SSH Keys**: Set up SSH key authentication
- **Firewall**: Basic firewall rules will be configured automatically
- **SSL Certificate**: Let's Encrypt will be configured automatically

## 🛠️ Manual Deployment Steps

### Step 1: System Preparation
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install git
sudo apt install -y git curl wget

# Create deploy user
sudo useradd -m -s /bin/bash deploy
sudo usermod -aG sudo deploy
```

### Step 2: Clone Repository
```bash
# Switch to deploy user
sudo su - deploy

# Clone repository
git clone https://github.com/tclabsjay/tippingpointconfigurator.git /opt/tippingpointconfigurator
cd /opt/tippingpointconfigurator
```

### Step 3: Run Deployment Script
```bash
# Make script executable
chmod +x deployment/scripts/deploy.sh

# Run deployment
./deployment/scripts/deploy.sh
```

### Step 4: Configure Environment
```bash
# Edit environment file
nano .env.local

# Update the following variables:
# - NEXT_PUBLIC_APP_URL=https://your-domain.com
# - CORS_ORIGIN=https://your-domain.com
# - NEXT_PUBLIC_CONTACT_EMAIL=your-email@domain.com
```

### Step 5: Security Hardening (Optional but Recommended)
```bash
# Run security hardening
./deployment/scripts/security-hardening.sh

# Setup monitoring
./deployment/scripts/monitoring.sh
```

## 🔧 Configuration Options

### Environment Variables (.env.local)
```bash
# Application Settings
NODE_ENV=production
PORT=3000
HOSTNAME=0.0.0.0
NEXT_PUBLIC_APP_URL=https://your-domain.com

# Contact Information
NEXT_PUBLIC_CONTACT_EMAIL=jay_kammerer@trendmicro.com
NEXT_PUBLIC_CONTACT_SUBJECT="TippingPoint Configurator Question"

# Security Settings
SESSION_SECRET=your-super-secret-session-key-change-this
FORCE_HTTPS=true
HSTS_MAX_AGE=31536000

# Performance Settings
MAX_MEMORY=2048
CLUSTER_INSTANCES=max

# Feature Flags
ADMIN_PANEL_ENABLED=true
DEV_TOOLS_ENABLED=false
```

### Nginx Configuration
The deployment automatically configures Nginx with:
- SSL/TLS termination
- Rate limiting
- Security headers
- Gzip compression
- Static file caching

### PM2 Configuration
The application runs with PM2 in cluster mode:
- Automatic restarts
- Load balancing
- Log management
- Memory monitoring

## 🔍 Verification & Testing

### Health Checks
```bash
# Check application health
curl https://your-domain.com/health

# Check API health
curl https://your-domain.com/api/health

# Check service status
systemctl status tippingpoint-configurator
pm2 status
```

### Security Verification
```bash
# Check firewall
sudo ufw status

# Check Fail2Ban
sudo fail2ban-client status

# Check SSL certificate
openssl s_client -connect your-domain.com:443 -servername your-domain.com
```

### Performance Testing
```bash
# Test application response
curl -w "@curl-format.txt" -o /dev/null -s https://your-domain.com/

# Check resource usage
htop
pm2 monit
```

## 🚨 Troubleshooting

### Common Issues

#### 1. Application Won't Start
```bash
# Check PM2 logs
pm2 logs

# Check system logs
sudo journalctl -u tippingpoint-configurator -f

# Restart application
pm2 restart ecosystem.config.js
```

#### 2. SSL Certificate Issues
```bash
# Check certificate status
sudo certbot certificates

# Renew certificate
sudo certbot renew --dry-run

# Restart Nginx
sudo systemctl restart nginx
```

#### 3. Permission Issues
```bash
# Fix ownership
sudo chown -R deploy:deploy /opt/tippingpointconfigurator

# Fix permissions
sudo chmod -R 755 /opt/tippingpointconfigurator
sudo chmod 600 /opt/tippingpointconfigurator/.env.local
```

#### 4. High Memory Usage
```bash
# Check memory usage
free -h
pm2 monit

# Restart with memory limit
pm2 restart ecosystem.config.js --max-memory-restart 1G
```

### Log Locations
```bash
# Application Logs
/var/log/tippingpoint-configurator/

# PM2 Logs
~/.pm2/logs/

# Nginx Logs
/var/log/nginx/

# System Logs
/var/log/syslog
/var/log/auth.log
```

## 📊 Monitoring & Maintenance

### Daily Checks
- Health endpoint status
- Error log review
- Resource usage monitoring
- Backup verification

### Weekly Tasks
- Security updates
- Log rotation cleanup
- Performance analysis
- Certificate expiry check

### Monthly Tasks
- Full security audit
- Backup restoration test
- Capacity planning review
- Documentation updates

## 🔄 Updates & Maintenance

### Application Updates
```bash
# Pull latest changes
cd /opt/tippingpointconfigurator
git pull origin main

# Install dependencies
npm ci --production

# Rebuild application
npm run build

# Restart with zero downtime
pm2 reload ecosystem.config.js
```

### System Updates
```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Update Node.js (if needed)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Update PM2
sudo npm install -g pm2@latest
```

## 🆘 Emergency Procedures

### Service Recovery
```bash
# Stop all services
pm2 kill
sudo systemctl stop nginx

# Start services
sudo systemctl start nginx
pm2 start ecosystem.config.js --env production
```

### Rollback Procedure
```bash
# Revert to previous version
git checkout HEAD~1

# Rebuild and restart
npm run build
pm2 reload ecosystem.config.js
```

### Backup Restoration
```bash
# Restore from backup
cp /opt/tippingpointconfigurator/backups/latest/* /opt/tippingpointconfigurator/data/

# Restart application
pm2 restart ecosystem.config.js
```

## 📞 Support Contacts

- **Technical Support**: Jay Kammerer (jay_kammerer@trendmicro.com)
- **Emergency Subject**: "TippingPoint Configurator - URGENT"
- **Documentation**: https://github.com/tclabsjay/tippingpointconfigurator

---

**Version**: 1.2  
**Last Updated**: December 2024  
**Next Review**: March 2025
