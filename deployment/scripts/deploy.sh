#!/bin/bash
# TippingPoint Configurator - Deployment Script for Ubuntu Server 22.04+
# Author: Infrastructure Team
# Version: 1.3.0

set -euo pipefail

# Configuration
APP_NAME="tippingpoint-configurator"
APP_DIR="/opt/tippingpointconfigurator"
DEPLOY_USER="deploy"
REPO_URL="https://github.com/tclabsjay/tippingpointconfigurator.git"
DOMAIN="your-domain.com"
NODE_VERSION="20"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" >&2
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

# Check if running as root
check_root() {
    if [[ $EUID -eq 0 ]]; then
        error "This script should not be run as root"
        exit 1
    fi
}

# Check Ubuntu version
check_ubuntu_version() {
    if ! grep -q "Ubuntu" /etc/os-release; then
        error "This script is designed for Ubuntu Server"
        exit 1
    fi
    
    VERSION=$(lsb_release -rs)
    if (( $(echo "$VERSION < 22.04" | bc -l) )); then
        error "Ubuntu 22.04 or higher is required. Current version: $VERSION"
        exit 1
    fi
    
    log "Ubuntu version check passed: $VERSION"
}

# Install system dependencies
install_system_dependencies() {
    log "Installing system dependencies..."
    
    sudo apt update
    sudo apt upgrade -y
    
    # Essential packages
    sudo apt install -y \
        curl \
        wget \
        git \
        build-essential \
        software-properties-common \
        apt-transport-https \
        ca-certificates \
        gnupg \
        lsb-release \
        ufw \
        fail2ban \
        logrotate \
        htop \
        tree \
        vim \
        bc
    
    log "System dependencies installed successfully"
}

# Install Node.js
install_nodejs() {
    log "Installing Node.js $NODE_VERSION..."
    
    # Remove existing Node.js if present
    sudo apt remove -y nodejs npm || true
    
    # Add NodeSource repository
    curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | sudo -E bash -
    
    # Install Node.js
    sudo apt install -y nodejs
    
    # Verify installation
    NODE_VER=$(node --version)
    NPM_VER=$(npm --version)
    
    log "Node.js installed: $NODE_VER"
    log "npm installed: $NPM_VER"
    
    # Install PM2 globally
    sudo npm install -g pm2@latest
    PM2_VER=$(pm2 --version)
    log "PM2 installed: $PM2_VER"
}

# Install and configure Nginx
install_nginx() {
    log "Installing and configuring Nginx..."
    
    sudo apt install -y nginx
    
    # Enable and start Nginx
    sudo systemctl enable nginx
    sudo systemctl start nginx
    
    # Create log directories
    sudo mkdir -p /var/log/nginx
    sudo chown www-data:www-data /var/log/nginx
    
    log "Nginx installed and configured"
}

# Configure firewall
configure_firewall() {
    log "Configuring UFW firewall..."
    
    # Reset UFW to defaults
    sudo ufw --force reset
    
    # Default policies
    sudo ufw default deny incoming
    sudo ufw default allow outgoing
    
    # Allow SSH
    sudo ufw allow ssh
    
    # Allow HTTP and HTTPS
    sudo ufw allow 'Nginx Full'
    
    # Enable firewall
    sudo ufw --force enable
    
    # Show status
    sudo ufw status verbose
    
    log "Firewall configured successfully"
}

# Create deploy user
create_deploy_user() {
    log "Creating deploy user..."
    
    if id "$DEPLOY_USER" &>/dev/null; then
        warning "User $DEPLOY_USER already exists"
    else
        sudo useradd -m -s /bin/bash $DEPLOY_USER
        sudo usermod -aG sudo $DEPLOY_USER
        log "User $DEPLOY_USER created successfully"
    fi
    
    # Create application directory
    sudo mkdir -p $APP_DIR
    sudo chown $DEPLOY_USER:$DEPLOY_USER $APP_DIR
    
    # Create log directory
    sudo mkdir -p /var/log/$APP_NAME
    sudo chown $DEPLOY_USER:$DEPLOY_USER /var/log/$APP_NAME
}

# Clone and setup application
setup_application() {
    log "Setting up application..."
    
    # Switch to deploy user context
    sudo -u $DEPLOY_USER bash << EOF
        cd $APP_DIR
        
        # Clone repository if not exists
        if [ ! -d ".git" ]; then
            git clone $REPO_URL .
        else
            git fetch origin
            git reset --hard origin/main
        fi
        
        # Install dependencies
        npm ci --production
        
        # Build application
        npm run build
        
        # Copy environment file
        if [ ! -f .env.local ]; then
            cp env.example .env.local
            echo "Please edit .env.local with your configuration"
        fi
EOF
    
    log "Application setup completed"
}

# Configure Nginx virtual host
configure_nginx_vhost() {
    log "Configuring Nginx virtual host..."
    
    # Copy Nginx configuration
    sudo cp $APP_DIR/deployment/nginx/tippingpoint-configurator.conf /etc/nginx/sites-available/$APP_NAME
    
    # Update domain in configuration
    sudo sed -i "s/your-domain.com/$DOMAIN/g" /etc/nginx/sites-available/$APP_NAME
    
    # Enable site
    sudo ln -sf /etc/nginx/sites-available/$APP_NAME /etc/nginx/sites-enabled/$APP_NAME
    
    # Remove default site
    sudo rm -f /etc/nginx/sites-enabled/default
    
    # Test configuration
    sudo nginx -t
    
    # Reload Nginx
    sudo systemctl reload nginx
    
    log "Nginx virtual host configured"
}

# Setup SSL with Let's Encrypt
setup_ssl() {
    log "Setting up SSL certificate..."
    
    # Install Certbot
    sudo apt install -y certbot python3-certbot-nginx
    
    # Get certificate (dry run first)
    warning "Please ensure DNS is pointing to this server before continuing"
    read -p "Continue with SSL setup? (y/N): " -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        sudo certbot --nginx -d $DOMAIN --non-interactive --agree-tos --email admin@$DOMAIN
        
        # Setup auto-renewal
        (crontab -l 2>/dev/null; echo "0 12 * * * /usr/bin/certbot renew --quiet") | crontab -
        
        log "SSL certificate configured successfully"
    else
        warning "SSL setup skipped. Configure manually later with: sudo certbot --nginx -d $DOMAIN"
    fi
}

# Configure systemd service
configure_systemd() {
    log "Configuring systemd service..."
    
    # Copy service file
    sudo cp $APP_DIR/deployment/systemd/tippingpoint-configurator.service /etc/systemd/system/
    
    # Reload systemd
    sudo systemctl daemon-reload
    
    # Enable service
    sudo systemctl enable tippingpoint-configurator
    
    log "Systemd service configured"
}

# Start application
start_application() {
    log "Starting application..."
    
    # Start with PM2 as deploy user
    sudo -u $DEPLOY_USER bash << EOF
        cd $APP_DIR
        pm2 start ecosystem.config.js --env production
        pm2 save
        pm2 startup systemd -u $DEPLOY_USER --hp /home/$DEPLOY_USER
EOF
    
    # Start systemd service
    sudo systemctl start tippingpoint-configurator
    
    # Check status
    sudo systemctl status tippingpoint-configurator --no-pager
    
    log "Application started successfully"
}

# Setup monitoring and logging
setup_monitoring() {
    log "Setting up monitoring and logging..."
    
    # Logrotate configuration
    sudo tee /etc/logrotate.d/tippingpoint-configurator > /dev/null << EOF
/var/log/$APP_NAME/*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 644 $DEPLOY_USER $DEPLOY_USER
    postrotate
        pm2 reloadLogs
    endscript
}
EOF
    
    # PM2 log rotation
    sudo -u $DEPLOY_USER pm2 install pm2-logrotate
    
    log "Monitoring and logging configured"
}

# Health check
health_check() {
    log "Performing health check..."
    
    # Wait for application to start
    sleep 10
    
    # Check if application is responding
    if curl -f -s http://localhost:3000/health > /dev/null; then
        log "Application health check passed"
    else
        error "Application health check failed"
        sudo systemctl status tippingpoint-configurator --no-pager
        exit 1
    fi
    
    # Check Nginx
    if sudo nginx -t > /dev/null 2>&1; then
        log "Nginx configuration check passed"
    else
        error "Nginx configuration check failed"
        exit 1
    fi
}

# Main deployment function
main() {
    log "Starting TippingPoint Configurator deployment..."
    
    check_root
    check_ubuntu_version
    install_system_dependencies
    install_nodejs
    install_nginx
    configure_firewall
    create_deploy_user
    setup_application
    configure_nginx_vhost
    setup_ssl
    configure_systemd
    start_application
    setup_monitoring
    health_check
    
    log "Deployment completed successfully!"
    info "Application is available at: https://$DOMAIN"
    info "Admin panel: https://$DOMAIN/dev-admin"
    info "Health check: https://$DOMAIN/health"
    
    warning "Don't forget to:"
    warning "1. Edit /opt/tippingpointconfigurator/.env.local with your configuration"
    warning "2. Configure DNS to point $DOMAIN to this server"
    warning "3. Review and adjust firewall rules if needed"
    warning "4. Setup monitoring and alerting"
}

# Run main function
main "$@"
