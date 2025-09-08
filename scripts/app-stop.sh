#!/bin/bash
# TippingPoint Configurator - Application Stop Script
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
STOP="🛑"
GEAR="⚙️"
CLOCK="⏱️"
FIRE="🔥"
SKULL="💀"

# Application configuration
APP_NAME="TippingPoint Configurator"
APP_VERSION="1.2"
PORT=3000
PID_FILE="/tmp/tippingpoint-configurator.pid"
LOG_FILE="/tmp/tippingpoint-app.log"

# Print banner
print_banner() {
    clear
    echo -e "${RED}╔══════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${RED}║${WHITE}                    TIPPINGPOINT CONFIGURATOR                     ${RED}║${NC}"
    echo -e "${RED}║${WHITE}                        Application Stopper                       ${RED}║${NC}"
    echo -e "${RED}║${CYAN}                           Version $APP_VERSION                            ${RED}║${NC}"
    echo -e "${RED}╚══════════════════════════════════════════════════════════════════╝${NC}"
    echo
}

# Print step with animation
print_step() {
    local step_num=$1
    local description=$2
    local icon=$3
    echo -e "${BOLD}${RED}[$step_num/5]${NC} ${icon} ${WHITE}$description${NC}"
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

# Animated countdown
countdown() {
    local seconds=$1
    local message=$2
    for i in $(seq $seconds -1 1); do
        echo -ne "\r       ${CLOCK} ${YELLOW}$message in ${i}s...${NC}"
        sleep 1
    done
    echo -ne "\r       ${CLOCK} ${YELLOW}$message now...    ${NC}\n"
}

# Check if application is running
is_app_running() {
    if [ -f "$PID_FILE" ]; then
        local pid=$(cat "$PID_FILE")
        if kill -0 $pid 2>/dev/null; then
            return 0
        else
            rm -f "$PID_FILE"
            return 1
        fi
    fi
    
    # Check by port
    if lsof -i :$PORT >/dev/null 2>&1; then
        return 0
    fi
    
    return 1
}

# Get running processes
get_running_processes() {
    local processes=""
    
    # Check PID file first
    if [ -f "$PID_FILE" ]; then
        local pid=$(cat "$PID_FILE")
        if kill -0 $pid 2>/dev/null; then
            processes="$processes $pid"
            # Get child processes of main PID
            local children=$(pgrep -P $pid 2>/dev/null || true)
            if [ -n "$children" ]; then
                processes="$processes $children"
            fi
        fi
    fi
    
    # Check port usage
    local port_pids=$(lsof -ti :$PORT 2>/dev/null || true)
    if [ -n "$port_pids" ]; then
        processes="$processes $port_pids"
    fi
    
    # Check npm/node processes in current directory
    local current_dir=$(pwd)
    local npm_pids=$(pgrep -f "npm.*dev.*$current_dir" 2>/dev/null || true)
    local node_pids=$(pgrep -f "next.*dev.*$current_dir" 2>/dev/null || true)
    local turbo_pids=$(pgrep -f "turbopack.*$current_dir" 2>/dev/null || true)
    
    processes="$processes $npm_pids $node_pids $turbo_pids"
    
    # Remove duplicates and empty values
    echo "$processes" | tr ' ' '\n' | sort -u | grep -v '^$' | tr '\n' ' '
}

# Kill processes gracefully
kill_processes() {
    local pids=$1
    local signal=$2
    local signal_name=$3
    
    if [ -z "$pids" ]; then
        return 0
    fi
    
    print_status "info" "Sending $signal_name signal to processes: $pids"
    
    # Send signal to all processes
    for pid in $pids; do
        if kill -0 $pid 2>/dev/null; then
            kill $signal $pid 2>/dev/null || true
            print_status "info" "Sent $signal_name to PID $pid"
        fi
    done
    
    # Wait for processes to terminate with progress indicator
    local max_wait=15
    local waited=0
    local remaining_pids=""
    
    while [ $waited -lt $max_wait ]; do
        remaining_pids=""
        for pid in $pids; do
            if kill -0 $pid 2>/dev/null; then
                remaining_pids="$remaining_pids $pid"
            fi
        done
        
        if [ -z "$remaining_pids" ]; then
            print_status "success" "All processes terminated successfully"
            break
        fi
        
        # Show progress
        echo -ne "\r       ⏱️ Waiting for processes to terminate... ${waited}s/${max_wait}s"
        sleep 1
        ((waited++))
    done
    
    echo # New line after progress
    echo "$remaining_pids"
}

# Get application stats before shutdown
get_app_stats() {
    local stats=""
    if curl -f -s -m 3 "http://localhost:$PORT/api/health" >/dev/null 2>&1; then
        local health_data=$(curl -s -m 3 "http://localhost:$PORT/api/health" 2>/dev/null || echo '{}')
        local uptime=$(echo "$health_data" | jq -r '.uptime // 0' 2>/dev/null || echo "0")
        local memory=$(echo "$health_data" | jq -r '.memory.used // 0' 2>/dev/null || echo "0")
        stats="Uptime: ${uptime}s, Memory: ${memory}MB"
    fi
    echo "$stats"
}

# Main shutdown process
main() {
    print_banner
    
    # Step 1: Check application status
    print_step 1 "Checking application status" "$GEAR"
    
    if ! is_app_running; then
        print_status "warning" "Application is not currently running"
        
        # Clean up any leftover files
        rm -f "$PID_FILE"
        
        echo
        echo -e "${YELLOW}╔══════════════════════════════════════════════════════════════════╗${NC}"
        echo -e "${YELLOW}║${WHITE}                   APPLICATION ALREADY STOPPED                   ${YELLOW}║${NC}"
        echo -e "${YELLOW}╚══════════════════════════════════════════════════════════════════╝${NC}"
        echo
        echo -e "${GREEN}✨ Nothing to stop - application is not running! ✨${NC}"
        echo
        exit 0
    fi
    
    print_status "success" "Application is currently running"
    
    # Get application stats
    local stats=$(get_app_stats)
    if [ -n "$stats" ]; then
        print_status "info" "$stats"
    fi
    
    echo
    
    # Step 2: Identify running processes
    print_step 2 "Identifying running processes" "🔍"
    
    local running_pids=$(get_running_processes)
    if [ -n "$running_pids" ]; then
        print_status "success" "Found running processes: $running_pids"
        
        # Show process details
        for pid in $running_pids; do
            if kill -0 $pid 2>/dev/null; then
                local process_info=$(ps -p $pid -o pid,ppid,cmd --no-headers 2>/dev/null | head -1 || echo "$pid - Unknown process")
                print_status "info" "PID $process_info"
            fi
        done
    else
        print_status "warning" "No specific processes found, will check port usage"
    fi
    
    echo
    
    # Step 3: Graceful shutdown
    print_step 3 "Initiating graceful shutdown" "$STOP"
    
    if [ -n "$running_pids" ]; then
        print_status "info" "Attempting graceful shutdown (SIGTERM)..."
        countdown 3 "Starting graceful shutdown"
        
        local remaining_pids=$(kill_processes "$running_pids" "-TERM" "SIGTERM")
        
        if [ -z "$remaining_pids" ]; then
            print_status "success" "All processes terminated gracefully"
        else
            print_status "warning" "Some processes still running: $remaining_pids"
        fi
    else
        print_status "info" "No processes found to terminate"
    fi
    
    echo
    
    # Step 4: Force shutdown if needed
    local final_check_pids=$(get_running_processes)
    if [ -n "$final_check_pids" ]; then
        print_step 4 "Force shutdown (if needed)" "$SKULL"
        
        print_status "warning" "Found remaining processes: $final_check_pids"
        countdown 3 "Force killing remaining processes"
        
        local still_running=$(kill_processes "$final_check_pids" "-KILL" "SIGKILL")
        
        if [ -z "$still_running" ]; then
            print_status "success" "All processes forcefully terminated"
        else
            print_status "error" "Some processes could not be terminated: $still_running"
            # Try one more time with broader cleanup
            pkill -f "npm.*dev" 2>/dev/null || true
            pkill -f "next.*dev" 2>/dev/null || true
            pkill -f "node.*turbopack" 2>/dev/null || true
            sleep 2
        fi
        
        echo
    else
        print_step 4 "Force shutdown (if needed)" "$CHECK"
        print_status "success" "Force shutdown not needed - all processes stopped gracefully"
        echo
    fi
    
    # Step 5: Cleanup
    print_step 5 "Cleaning up resources" "🧹"
    
    # Remove PID file
    if [ -f "$PID_FILE" ]; then
        rm -f "$PID_FILE"
        print_status "success" "Removed PID file"
    fi
    
    # Check port availability
    if lsof -i :$PORT >/dev/null 2>&1; then
        print_status "warning" "Port $PORT is still in use"
        local port_processes=$(lsof -ti :$PORT 2>/dev/null || true)
        if [ -n "$port_processes" ]; then
            print_status "info" "Killing remaining port processes: $port_processes"
            echo "$port_processes" | xargs kill -KILL 2>/dev/null || true
        fi
    else
        print_status "success" "Port $PORT is now available"
    fi
    
    # Archive logs
    if [ -f "$LOG_FILE" ]; then
        local log_archive="/tmp/tippingpoint-app-$(date +%Y%m%d-%H%M%S).log"
        mv "$LOG_FILE" "$log_archive"
        print_status "success" "Logs archived to: $log_archive"
    fi
    
    # Final verification
    sleep 2
    if is_app_running; then
        print_status "error" "Application may still be running"
    else
        print_status "success" "Application completely stopped"
    fi
    
    echo
    
    # Success banner
    echo -e "${RED}╔══════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${RED}║${WHITE}                     🛑 SHUTDOWN COMPLETE! 🛑                     ${RED}║${NC}"
    echo -e "${RED}╚══════════════════════════════════════════════════════════════════╝${NC}"
    echo
    
    # Application info
    echo -e "${BOLD}${WHITE}Shutdown Summary:${NC}"
    echo -e "  ${STOP} ${BOLD}Application:${NC}    $APP_NAME"
    echo -e "  ${SKULL} ${BOLD}Status:${NC}         ${RED}Stopped${NC}"
    echo -e "  ${CHECK} ${BOLD}Port $PORT:${NC}        ${GREEN}Available${NC}"
    echo -e "  ${GEAR} ${BOLD}Cleanup:${NC}        ${GREEN}Complete${NC}"
    echo
    
    echo -e "${BOLD}${WHITE}Management Commands:${NC}"
    echo -e "  ${GREEN}Start Application:${NC}    ./scripts/app-start.sh"
    echo -e "  ${YELLOW}Restart Application:${NC}  ./scripts/app-restart.sh"
    echo -e "  ${BLUE}View Archived Logs:${NC}   ls -la /tmp/tippingpoint-app-*.log"
    echo
    
    echo -e "${GREEN}${BOLD}✨ TippingPoint Configurator stopped successfully! ✨${NC}"
    echo
}

# Run main function
main "$@"
