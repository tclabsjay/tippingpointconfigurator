#!/bin/bash
# TippingPoint Configurator - Application Start Script
# Professional application management with visual feedback

set -euo pipefail

# Colors and styling
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
NC='\033[0m' # No Color
BOLD='\033[1m'

# Unicode symbols
CHECK="✅"
CROSS="❌"
START="🟢"
GEAR="⚙️"
CLOCK="⏱️"
FIRE="🔥"
STAR="⭐"

# Application configuration
APP_NAME="TippingPoint Configurator"
APP_VERSION="1.0"
PORT=3000
HEALTH_ENDPOINT="http://localhost:$PORT/api/health"
APP_URL="http://localhost:$PORT/tpc"
STARTUP_TIMEOUT=30
PID_FILE="/tmp/tippingpoint-configurator.pid"

# Print banner
print_banner() {
    clear
    echo -e "${PURPLE}╔══════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${PURPLE}║${WHITE}                    TIPPINGPOINT CONFIGURATOR                     ${PURPLE}║${NC}"
    echo -e "${PURPLE}║${WHITE}                        Application Starter                       ${PURPLE}║${NC}"
    echo -e "${PURPLE}║${CYAN}                           Version $APP_VERSION                            ${PURPLE}║${NC}"
    echo -e "${PURPLE}╚══════════════════════════════════════════════════════════════════╝${NC}"
    echo
}

# Print step with animation
print_step() {
    local step_num=$1
    local description=$2
    local icon=$3
    echo -e "${BOLD}${BLUE}[$step_num/6]${NC} ${icon} ${WHITE}$description${NC}"
}

# Print status with color
print_status() {
    local status=$1
    local message=$2
    case $status in
        "success") echo -e "       ${CHECK} ${GREEN}$message${NC}" ;;
        "error")   echo -e "       ${CROSS} ${RED}$message${NC}" ;;
        "warning") echo -e "       ${YELLOW}⚠️  $message${NC}" ;;
        "info")    echo -e "       ${BLUE}ℹ️  $message${NC}" ;;
        "wait")    echo -e "       ${CLOCK} ${YELLOW}$message${NC}" ;;
    esac
}

# Animated loading spinner
spinner() {
    local pid=$1
    local message=$2
    local spin='⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏'
    local i=0
    
    echo -n "       "
    while kill -0 $pid 2>/dev/null; do
        i=$(( (i+1) %10 ))
        printf "\r       ${CYAN}${spin:$i:1}${NC} ${message}"
        sleep 0.1
    done
    printf "\r"
}

# Check if port is available
check_port() {
    if lsof -i :$PORT >/dev/null 2>&1; then
        return 1
    else
        return 0
    fi
}

# Kill existing processes
kill_existing() {
    print_status "info" "Cleaning up existing processes..."
    
    # Kill processes using the port
    local port_pids=$(lsof -ti :$PORT 2>/dev/null || true)
    if [ -n "$port_pids" ]; then
        print_status "info" "Terminating processes on port $PORT: $port_pids"
        echo "$port_pids" | xargs kill -TERM 2>/dev/null || true
        sleep 3
        # Check if still running and force kill
        local still_running=$(lsof -ti :$PORT 2>/dev/null || true)
        if [ -n "$still_running" ]; then
            echo "$still_running" | xargs kill -KILL 2>/dev/null || true
            sleep 1
        fi
    fi
    
    # Kill npm/node processes in current directory
    local current_dir=$(pwd)
    pkill -f "npm.*dev.*$current_dir" 2>/dev/null || true
    pkill -f "next.*dev.*$current_dir" 2>/dev/null || true
    pkill -f "turbopack.*$current_dir" 2>/dev/null || true
    
    # Remove stale PID file
    rm -f "$PID_FILE"
    
    # Wait a moment for cleanup
    sleep 2
}

# Wait for application to be ready
wait_for_ready() {
    local max_attempts=60
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if curl -f -s -m 5 "$HEALTH_ENDPOINT" >/dev/null 2>&1; then
            return 0
        fi
        sleep 1
        ((attempt++))
    done
    return 1
}

# Get application health info
get_health_info() {
    local health_data=$(curl -s -m 5 "$HEALTH_ENDPOINT" 2>/dev/null || echo '{}')
    local status=$(echo "$health_data" | jq -r '.status // "unknown"' 2>/dev/null || echo "unknown")
    local uptime=$(echo "$health_data" | jq -r '.uptime // 0' 2>/dev/null || echo "0")
    local memory=$(echo "$health_data" | jq -r '.memory.used // 0' 2>/dev/null || echo "0")
    
    echo "$status|$uptime|$memory"
}

# Main startup process
main() {
    print_banner
    
    # Step 1: Pre-flight checks
    print_step 1 "Running pre-flight checks" "$GEAR"
    
    # Check if we're in the right directory
    if [ ! -f "package.json" ]; then
        print_status "error" "Not in TippingPoint Configurator directory"
        echo -e "\n${RED}Please run this script from the application root directory.${NC}\n"
        echo -e "${YELLOW}Current directory: $(pwd)${NC}\n"
        exit 1
    fi
    
    # Check for Next.js configuration (either .ts or .js)
    if [ ! -f "next.config.ts" ] && [ ! -f "next.config.js" ] && [ ! -f "next.config.mjs" ]; then
        print_status "error" "Next.js configuration file not found"
        echo -e "\n${RED}This doesn't appear to be a Next.js project directory.${NC}\n"
        echo -e "${YELLOW}Current directory: $(pwd)${NC}\n"
        exit 1
    fi
    
    print_status "success" "Application directory verified"
    
    # Check Node.js
    if ! command -v node >/dev/null 2>&1; then
        print_status "error" "Node.js not found"
        exit 1
    fi
    
    local node_version=$(node --version)
    print_status "success" "Node.js found: $node_version"
    
    # Check npm
    if ! command -v npm >/dev/null 2>&1; then
        print_status "error" "npm not found"
        exit 1
    fi
    
    local npm_version=$(npm --version)
    print_status "success" "npm found: v$npm_version"
    
    echo
    
    # Step 2: Clean up existing processes
    print_step 2 "Cleaning up existing processes" "🧹"
    
    if check_port; then
        print_status "success" "Port $PORT is available"
    else
        print_status "warning" "Port $PORT is in use, cleaning up..."
        kill_existing
        sleep 2
        if check_port; then
            print_status "success" "Port $PORT is now available"
        else
            print_status "error" "Unable to free port $PORT"
            exit 1
        fi
    fi
    
    echo
    
    # Step 3: Install dependencies
    print_step 3 "Checking dependencies" "📦"
    
    if [ ! -d "node_modules" ] || [ ! -f "node_modules/.package-lock.json" ]; then
        print_status "warning" "Dependencies not found, installing..."
        npm install --silent &
        local npm_pid=$!
        spinner $npm_pid "Installing dependencies..."
        wait $npm_pid
        print_status "success" "Dependencies installed successfully"
    else
        print_status "success" "Dependencies are up to date"
    fi
    
    echo
    
    # Step 4: Start the application
    print_step 4 "Starting application server" "$START"
    
    print_status "info" "Launching Next.js development server..."
    
    # Start the application in background
    
    # Use nohup to ensure process survives
    nohup npm run dev --silent > /tmp/tippingpoint-app.log 2>&1 &
    local app_pid=$!
    echo $app_pid > "$PID_FILE"
    
    # Verify the process started
    sleep 2
    if ! kill -0 $app_pid 2>/dev/null; then
        print_status "error" "Application process failed to start"
        rm -f "$PID_FILE"
        echo -e "\n${RED}Check the logs: tail -f /tmp/tippingpoint-app.log${NC}\n"
        exit 1
    fi
    
    # Show startup progress
    local dots=""
    for i in {1..8}; do
        dots+="."
        echo -ne "\r       ${CLOCK} ${YELLOW}Starting server$dots${NC}"
        sleep 0.5
    done
    echo
    
    print_status "success" "Application process started (PID: $app_pid)"
    print_status "info" "Process is running and stable"
    
    echo
    
    # Step 5: Wait for application to be ready
    print_step 5 "Waiting for application to be ready" "$CLOCK"
    
    if wait_for_ready; then
        print_status "success" "Application is responding to health checks"
    else
        print_status "error" "Application failed to start within $STARTUP_TIMEOUT seconds"
        if [ -f "$PID_FILE" ]; then
            local pid=$(cat "$PID_FILE")
            kill $pid 2>/dev/null || true
            rm -f "$PID_FILE"
        fi
        echo -e "\n${RED}Check the logs in /tmp/tippingpoint-app.log for details.${NC}\n"
        exit 1
    fi
    
    echo
    
    # Step 6: Final verification
    print_step 6 "Final system verification" "$STAR"
    
    # Get health information
    local health_info=$(get_health_info)
    local status=$(echo "$health_info" | cut -d'|' -f1)
    local uptime=$(echo "$health_info" | cut -d'|' -f2)
    local memory=$(echo "$health_info" | cut -d'|' -f3)
    
    if [ "$status" = "healthy" ]; then
        print_status "success" "Application health check: $status"
        print_status "success" "Memory usage: ${memory}MB"
        print_status "success" "Uptime: ${uptime}s"
    else
        print_status "warning" "Application health check: $status"
    fi
    
    # Test main endpoints
    if curl -f -s -m 5 "$APP_URL" >/dev/null 2>&1; then
        print_status "success" "Main application endpoint responding"
    else
        print_status "warning" "Main application endpoint not responding"
    fi
    
    if curl -f -s -m 5 "http://localhost:$PORT/api/txe" >/dev/null 2>&1; then
        print_status "success" "API endpoints responding"
    else
        print_status "warning" "API endpoints not responding"
    fi
    
    echo
    
    # Success banner
    echo -e "${GREEN}╔══════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║${WHITE}                     🎉 STARTUP COMPLETE! 🎉                     ${GREEN}║${NC}"
    echo -e "${GREEN}╚══════════════════════════════════════════════════════════════════╝${NC}"
    echo
    
    # Application info
    echo -e "${BOLD}${WHITE}Application Details:${NC}"
    echo -e "  ${FIRE} ${BOLD}Name:${NC}           $APP_NAME"
    echo -e "  ${STAR} ${BOLD}Version:${NC}        $APP_VERSION"
    echo -e "  ${START} ${BOLD}Status:${NC}         ${GREEN}Running${NC}"
    echo -e "  ${GEAR} ${BOLD}Process ID:${NC}     $(cat $PID_FILE 2>/dev/null || echo 'Unknown')"
    echo
    
    echo -e "${BOLD}${WHITE}Access URLs:${NC}"
    echo -e "  ${BLUE}🌐 Main Application:${NC}  ${CYAN}$APP_URL${NC}"
    echo -e "  ${BLUE}🔍 Health Check:${NC}      ${CYAN}$HEALTH_ENDPOINT${NC}"
    echo -e "  ${BLUE}⚙️  Admin Panel:${NC}       ${CYAN}http://localhost:$PORT/dev-admin${NC}"
    echo
    
    echo -e "${BOLD}${WHITE}Management Commands:${NC}"
    echo -e "  ${YELLOW}Stop Application:${NC}     ./scripts/app-stop.sh"
    echo -e "  ${YELLOW}Restart Application:${NC}  ./scripts/app-restart.sh"
    echo -e "  ${YELLOW}View Logs:${NC}            tail -f /tmp/tippingpoint-app.log"
    echo
    
    echo -e "${GREEN}${BOLD}✨ TippingPoint Configurator is ready for use! ✨${NC}"
    echo
}

# Run main function
main "$@"
