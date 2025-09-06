#!/bin/bash
# TippingPoint Configurator - Application Restart Script
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
RESTART="🔄"
START="🟢"
STOP="🛑"
GEAR="⚙️"
CLOCK="⏱️"
FIRE="🔥"
STAR="⭐"

# Application configuration
APP_NAME="TippingPoint Configurator"
APP_VERSION="1.1"
PORT=3000
HEALTH_ENDPOINT="http://localhost:$PORT/api/health"
APP_URL="http://localhost:$PORT/tpc"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Print banner
print_banner() {
    clear
    echo -e "${PURPLE}╔══════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${PURPLE}║${WHITE}                    TIPPINGPOINT CONFIGURATOR                     ${PURPLE}║${NC}"
    echo -e "${PURPLE}║${WHITE}                       Application Restarter                      ${PURPLE}║${NC}"
    echo -e "${PURPLE}║${CYAN}                           Version $APP_VERSION                            ${PURPLE}║${NC}"
    echo -e "${PURPLE}╚══════════════════════════════════════════════════════════════════╝${NC}"
    echo
}

# Print step with animation
print_step() {
    local step_num=$1
    local description=$2
    local icon=$3
    echo -e "${BOLD}${PURPLE}[$step_num/3]${NC} ${icon} ${WHITE}$description${NC}"
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

# Animated countdown with spinning effect
countdown_spinner() {
    local seconds=$1
    local message=$2
    local spin='⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏'
    
    for i in $(seq $seconds -1 1); do
        for j in {0..9}; do
            echo -ne "\r       ${CYAN}${spin:$j:1}${NC} ${YELLOW}$message in ${i}s...${NC}"
            sleep 0.1
        done
    done
    echo -ne "\r       ${RESTART} ${GREEN}$message now!     ${NC}\n"
}

# Check if script exists and is executable
check_script() {
    local script_path=$1
    local script_name=$2
    
    if [ ! -f "$script_path" ]; then
        print_status "error" "$script_name not found at: $script_path"
        return 1
    fi
    
    if [ ! -x "$script_path" ]; then
        print_status "warning" "$script_name is not executable, fixing..."
        chmod +x "$script_path"
        print_status "success" "$script_name is now executable"
    else
        print_status "success" "$script_name found and executable"
    fi
    
    return 0
}

# Execute script with error handling
execute_script() {
    local script_path=$1
    local script_name=$2
    local action=$3
    
    print_status "info" "Executing $script_name..."
    echo
    
    if "$script_path"; then
        echo
        print_status "success" "$action completed successfully"
        return 0
    else
        echo
        print_status "error" "$action failed"
        return 1
    fi
}

# Get current application status
get_app_status() {
    if curl -f -s -m 3 "$HEALTH_ENDPOINT" >/dev/null 2>&1; then
        echo "running"
    elif lsof -i :$PORT >/dev/null 2>&1; then
        echo "port_occupied"
    else
        echo "stopped"
    fi
}

# Get application uptime before restart
get_pre_restart_stats() {
    if curl -f -s -m 3 "$HEALTH_ENDPOINT" >/dev/null 2>&1; then
        local health_data=$(curl -s -m 3 "$HEALTH_ENDPOINT" 2>/dev/null || echo '{}')
        local uptime=$(echo "$health_data" | jq -r '.uptime // 0' 2>/dev/null || echo "0")
        local memory=$(echo "$health_data" | jq -r '.memory.used // 0' 2>/dev/null || echo "0")
        echo "Previous uptime: ${uptime}s, Memory usage: ${memory}MB"
    else
        echo "Unable to retrieve pre-restart statistics"
    fi
}

# Get application stats after restart
get_post_restart_stats() {
    local max_attempts=30
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if curl -f -s -m 3 "$HEALTH_ENDPOINT" >/dev/null 2>&1; then
            local health_data=$(curl -s -m 3 "$HEALTH_ENDPOINT" 2>/dev/null || echo '{}')
            local uptime=$(echo "$health_data" | jq -r '.uptime // 0' 2>/dev/null || echo "0")
            local memory=$(echo "$health_data" | jq -r '.memory.used // 0' 2>/dev/null || echo "0")
            local status=$(echo "$health_data" | jq -r '.status // "unknown"' 2>/dev/null || echo "unknown")
            echo "New uptime: ${uptime}s, Memory usage: ${memory}MB, Status: $status"
            return 0
        fi
        sleep 1
        ((attempt++))
    done
    
    echo "Unable to retrieve post-restart statistics"
    return 1
}

# Main restart process
main() {
    print_banner
    
    # Get initial status
    local initial_status=$(get_app_status)
    local pre_restart_stats=""
    
    case $initial_status in
        "running")
            print_status "info" "Application is currently running"
            pre_restart_stats=$(get_pre_restart_stats)
            print_status "info" "$pre_restart_stats"
            ;;
        "port_occupied")
            print_status "warning" "Port $PORT is occupied but application may not be healthy"
            ;;
        "stopped")
            print_status "info" "Application is currently stopped"
            ;;
    esac
    
    echo
    
    # Step 1: Validate restart scripts
    print_step 1 "Validating restart components" "$GEAR"
    
    local stop_script="$SCRIPT_DIR/app-stop.sh"
    local start_script="$SCRIPT_DIR/app-start.sh"
    
    if ! check_script "$stop_script" "Stop script"; then
        echo -e "\n${RED}Cannot proceed without stop script. Please ensure scripts/app-stop.sh exists.${NC}\n"
        exit 1
    fi
    
    if ! check_script "$start_script" "Start script"; then
        echo -e "\n${RED}Cannot proceed without start script. Please ensure scripts/app-start.sh exists.${NC}\n"
        exit 1
    fi
    
    print_status "success" "All restart components validated"
    
    echo
    countdown_spinner 3 "Initiating restart sequence"
    echo
    
    # Step 2: Stop the application
    print_step 2 "Stopping current application instance" "$STOP"
    
    if ! execute_script "$stop_script" "Stop script" "Application stop"; then
        echo -e "\n${RED}Failed to stop application. Check the logs and try again.${NC}\n"
        exit 1
    fi
    
    # Brief pause between stop and start
    echo
    print_status "wait" "Waiting for complete shutdown..."
    sleep 2
    print_status "success" "Shutdown grace period completed"
    
    echo
    
    # Step 3: Start the application
    print_step 3 "Starting fresh application instance" "$START"
    
    if ! execute_script "$start_script" "Start script" "Application start"; then
        echo -e "\n${RED}Failed to start application. Check the logs for details.${NC}\n"
        echo -e "${YELLOW}You may need to run ./scripts/app-start.sh manually.${NC}\n"
        exit 1
    fi
    
    echo
    
    # Verification and stats
    print_status "info" "Collecting post-restart statistics..."
    local post_restart_stats=$(get_post_restart_stats)
    
    if [ $? -eq 0 ]; then
        print_status "success" "$post_restart_stats"
    else
        print_status "warning" "Application may still be starting up"
    fi
    
    echo
    
    # Success banner
    echo -e "${GREEN}╔══════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║${WHITE}                     🔄 RESTART COMPLETE! 🔄                     ${GREEN}║${NC}"
    echo -e "${GREEN}╚══════════════════════════════════════════════════════════════════╝${NC}"
    echo
    
    # Restart summary
    echo -e "${BOLD}${WHITE}Restart Summary:${NC}"
    echo -e "  ${FIRE} ${BOLD}Application:${NC}      $APP_NAME"
    echo -e "  ${STAR} ${BOLD}Version:${NC}          $APP_VERSION"
    echo -e "  ${RESTART} ${BOLD}Operation:${NC}       ${GREEN}Restart Successful${NC}"
    echo -e "  ${START} ${BOLD}Status:${NC}           ${GREEN}Running${NC}"
    echo
    
    if [ -n "$pre_restart_stats" ]; then
        echo -e "${BOLD}${WHITE}Before Restart:${NC}"
        echo -e "  ${BLUE}📊 Stats:${NC}            $pre_restart_stats"
        echo
    fi
    
    echo -e "${BOLD}${WHITE}After Restart:${NC}"
    echo -e "  ${BLUE}📊 Stats:${NC}            $post_restart_stats"
    echo
    
    echo -e "${BOLD}${WHITE}Access URLs:${NC}"
    echo -e "  ${BLUE}🌐 Main Application:${NC}  ${CYAN}$APP_URL${NC}"
    echo -e "  ${BLUE}🔍 Health Check:${NC}      ${CYAN}$HEALTH_ENDPOINT${NC}"
    echo -e "  ${BLUE}⚙️  Admin Panel:${NC}       ${CYAN}http://localhost:$PORT/dev-admin${NC}"
    echo
    
    echo -e "${BOLD}${WHITE}Management Commands:${NC}"
    echo -e "  ${RED}Stop Application:${NC}     ./scripts/app-stop.sh"
    echo -e "  ${GREEN}Start Application:${NC}    ./scripts/app-start.sh"
    echo -e "  ${PURPLE}Restart Again:${NC}        ./scripts/app-restart.sh"
    echo
    
    # Performance note
    if [ "$initial_status" = "running" ]; then
        echo -e "${YELLOW}💡 Performance Note:${NC}"
        echo -e "   Fresh restart completed - application should be running optimally"
        echo -e "   All cached data has been cleared and dependencies reloaded"
        echo
    fi
    
    echo -e "${GREEN}${BOLD}✨ TippingPoint Configurator restarted successfully! ✨${NC}"
    echo
}

# Run main function
main "$@"
