# TippingPoint Configurator

A professional web application for configuring TippingPoint TXE series hardware, modules, and licenses with advanced quote generation capabilities.

## 🚀 Features

- **Multi-Configuration Management**: Create, clone, and manage multiple hardware configurations
- **TXE Model Selection**: Support for 5600 TXE, 8600 TXE, and 9200 TXE models with bandwidth tiers
- **Smart License Matching**: Automatic bandwidth matching between TPS Inspection and ThreatDV licenses
- **IO Module Configuration**: Comprehensive slot management with bypass modules
- **SMS Integration**: Optional TippingPoint SMS management selection
- **Professional Quote Generation**: Copy-formatted quotes with table formatting for Dynamics
- **Admin Backend**: Development administration for catalog management

## 🏗️ Architecture

- **Frontend**: Next.js 15 with TypeScript and Tailwind CSS
- **Backend**: Next.js API Routes with file-based data storage
- **Data Storage**: JSON-based catalog with automatic backups
- **Deployment**: Node.js with PM2 process management

## 📋 System Requirements

### Hardware Requirements (Minimum)
- **CPU**: 2 vCPU cores (4+ recommended for production)
- **RAM**: 4GB (8GB+ recommended for production)
- **Storage**: 20GB SSD (50GB+ recommended with logs/backups)
- **Network**: 1Gbps network interface

### Hardware Requirements (Production)
- **CPU**: 4+ vCPU cores
- **RAM**: 8GB+ 
- **Storage**: 100GB+ SSD with backup storage
- **Network**: 1Gbps+ with load balancer support

## 🛠️ Infrastructure Requirements

### Ubuntu Server 22.04+ Dependencies

#### Core System Updates
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl wget git build-essential
```

#### Node.js 20+ (LTS)
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
node --version  # Should be 20.x+
npm --version   # Should be 10.x+
```

#### PM2 Process Manager
```bash
sudo npm install -g pm2
pm2 --version
```

#### Nginx (Reverse Proxy)
```bash
sudo apt install -y nginx
sudo systemctl enable nginx
sudo systemctl start nginx
```

#### UFW Firewall
```bash
sudo ufw enable
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw status
```

#### SSL/TLS (Let's Encrypt)
```bash
sudo apt install -y certbot python3-certbot-nginx
```

## ⚡ Quick Start (One-Line Deployment)

For Ubuntu Server 22.04+, you can deploy the entire application with a single command:

```bash
curl -sSL https://raw.githubusercontent.com/tclabsjay/tippingpointconfigurator/main/deployment/scripts/deploy.sh | bash
```

This will automatically:
- Install all dependencies (Node.js, PM2, Nginx)
- Configure security (UFW firewall, SSL certificates)
- Deploy and start the application
- Set up monitoring and logging

## 🚀 Manual Deployment Guide

### 1. Clone Repository
```bash
cd /opt
sudo git clone https://github.com/tclabsjay/tippingpointconfigurator.git
sudo chown -R $USER:$USER /opt/tippingpointconfigurator
cd /opt/tippingpointconfigurator
```

### 2. Install Dependencies
```bash
npm ci --production
npm run build
```

### 3. Environment Configuration
```bash
cp .env.example .env.local
nano .env.local
```

### 4. Start Application with PM2
```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### 5. Configure Nginx
```bash
sudo cp deployment/nginx.conf /etc/nginx/sites-available/tippingpoint-configurator
sudo ln -s /etc/nginx/sites-available/tippingpoint-configurator /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 6. SSL Certificate
```bash
sudo certbot --nginx -d your-domain.com
```

## 🔧 Configuration Files

- `ecosystem.config.js` - PM2 configuration
- `deployment/nginx.conf` - Nginx reverse proxy configuration
- `deployment/systemd/` - Systemd service files
- `deployment/scripts/` - Deployment automation scripts

## 📊 Monitoring & Logging

- **Application Logs**: PM2 manages application logs
- **Access Logs**: Nginx access and error logs
- **System Monitoring**: Built-in health checks
- **Process Management**: PM2 process monitoring

## 🔒 Security Features

- **Firewall Configuration**: UFW with minimal open ports
- **SSL/TLS Encryption**: Let's Encrypt certificates
- **Reverse Proxy**: Nginx with security headers
- **Process Isolation**: Non-root user execution
- **Input Validation**: Zod schema validation

## 🛡️ Backup Strategy

- **Automatic Data Backups**: Built-in catalog backup system
- **Configuration Backups**: Automated config file backups
- **Database Exports**: JSON catalog exports
- **Recovery Procedures**: Documented recovery processes

## 📈 Performance Optimization

- **Static Asset Caching**: Nginx static file serving
- **Gzip Compression**: Enabled for all text assets
- **Keep-Alive Connections**: Optimized connection handling
- **Process Clustering**: PM2 cluster mode for scaling

## 🔍 Health Checks

- **Application Health**: `/api/health` endpoint
- **System Resources**: CPU, memory, disk monitoring
- **Process Status**: PM2 process health monitoring
- **Network Connectivity**: Port and service checks

## 📞 Support

- **Contact**: Jay Kammerer (jay_kammerer@trendmicro.com)
- **Subject**: TippingPoint Configurator Question
- **Version**: 1.1

## 📄 License

Proprietary - Trend Micro Inc.