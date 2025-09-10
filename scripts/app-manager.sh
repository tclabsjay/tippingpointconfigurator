#!/bin/bash
# TippingPoint Configurator - Application Manager
# Interactive management interface with visual feedback

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
ROCKET="🚀"
STOP="🛑"
RESTART="🔄"
GEAR="⚙️"
CLOCK="⏱️"
FIRE="🔥"
STAR="⭐"
EYES="👀"
CHART="📊"

# Application configuration
APP_NAME="TippingPoint Configurator"
APP_VERSION="1.3.0"
PORT=3000
HEALTH_ENDPOINT="http://localhost:$PORT/api/health"
APP_URL="http://localhost:$PORT/tpc"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Print main banner
print_banner() {
    clear
    echo -e "${CYAN}╔══════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║${WHITE}                    TIPPINGPOINT CONFIGURATOR                     ${CYAN}║${NC}"
    echo -e "${CYAN}║${WHITE}                       Application Manager                        ${CYAN}║${NC}"
    echo -e "${CYAN}║${YELLOW}                           Version $APP_VERSION                            ${CYAN}║${NC}"
    echo -e "${CYAN}╚══════════════════════════════════════════════════════════════════╝${NC}"
    echo
}

# Print status with color
print_status() {
    local status=$1
    local message=$2
    case $status in
        "success") echo -e "   ${CHECK} ${GREEN}$message${NC}" ;;
        "error")   echo -e "   ${CROSS} ${RED}$message${NC}" ;;
        "warning") echo -e "   ${YELLOW}⚠️  $message${NC}" ;;
        "info")    echo -e "   ${BLUE}ℹ️  $message${NC}" ;;
    esac
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

# Get detailed application info
get_app_info() {
    local status=$(get_app_status)
    
    case $status in
        "running")
            local health_data=$(curl -s -m 3 "$HEALTH_ENDPOINT" 2>/dev/null || echo '{}')
            local uptime=$(echo "$health_data" | jq -r '.uptime // 0' 2>/dev/null || echo "0")
            local memory=$(echo "$health_data" | jq -r '.memory.used // 0' 2>/dev/null || echo "0")
            local app_status=$(echo "$health_data" | jq -r '.status // "unknown"' 2>/dev/null || echo "unknown")
            echo "running|$uptime|$memory|$app_status"
            ;;
        "port_occupied")
            echo "port_occupied|0|0|unknown"
            ;;
        *)
            echo "stopped|0|0|stopped"
            ;;
    esac
}

# Display current status
show_status() {
    echo -e "${BOLD}${WHITE}Current Application Status:${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    
    local info=$(get_app_info)
    local status=$(echo "$info" | cut -d'|' -f1)
    local uptime=$(echo "$info" | cut -d'|' -f2)
    local memory=$(echo "$info" | cut -d'|' -f3)
    local app_status=$(echo "$info" | cut -d'|' -f4)
    
    case $status in
        "running")
            print_status "success" "Application Status: ${GREEN}RUNNING${NC}"
            print_status "info" "Health Check: $app_status"
            print_status "info" "Uptime: ${uptime}s"
            print_status "info" "Memory Usage: ${memory}MB"
            print_status "info" "Port $PORT: In Use"
            ;;
        "port_occupied")
            print_status "warning" "Application Status: ${YELLOW}PORT OCCUPIED${NC}"
            print_status "warning" "Port $PORT: In Use (Unknown Process)"
            print_status "warning" "Health Check: Not Responding"
            ;;
        *)
            print_status "error" "Application Status: ${RED}STOPPED${NC}"
            print_status "info" "Port $PORT: Available"
            print_status "info" "Health Check: Not Available"
            ;;
    esac
    
    echo
}

# Display application URLs
show_urls() {
    local status=$(get_app_status)
    
    echo -e "${BOLD}${WHITE}Application URLs:${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    
    if [ "$status" = "running" ]; then
        echo -e "   🟢 Main Application:  ${CYAN}$APP_URL${NC} ${GREEN}(Active)${NC}"
        echo -e "   ${CHART} Health Check:      ${CYAN}$HEALTH_ENDPOINT${NC} ${GREEN}(Active)${NC}"
        echo -e "   ${GEAR} Admin Panel:       ${CYAN}http://localhost:$PORT/dev-admin${NC} ${GREEN}(Active)${NC}"
    else
        echo -e "   🔴 Main Application:  ${CYAN}$APP_URL${NC} ${RED}(Inactive)${NC}"
        echo -e "   ${CHART} Health Check:      ${CYAN}$HEALTH_ENDPOINT${NC} ${RED}(Inactive)${NC}"
        echo -e "   ${GEAR} Admin Panel:       ${CYAN}http://localhost:$PORT/dev-admin${NC} ${RED}(Inactive)${NC}"
    fi
    
    echo
}

# Display menu options
show_menu() {
    local status=$(get_app_status)
    
    echo -e "${BOLD}${WHITE}Available Actions:${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    
    if [ "$status" = "running" ]; then
        echo -e "   ${RED}1)${NC} ${STOP} Stop Application"
        echo -e "   ${PURPLE}2)${NC} ${RESTART} Restart Application"
        echo -e "   ${YELLOW}3)${NC} ${EYES} View Logs"
        echo -e "   ${BLUE}4)${NC} ${CHART} Refresh Status"
    elif [ "$status" = "port_occupied" ]; then
        echo -e "   ${RED}1)${NC} ${STOP} Force Stop (Port Cleanup)"
        echo -e "   ${GREEN}2)${NC} 🟢 Start Application"
        echo -e "   ${BLUE}3)${NC} ${CHART} Refresh Status"
    else
        echo -e "   ${GREEN}1)${NC} 🟢 Start Application"
        echo -e "   ${YELLOW}2)${NC} ${EYES} View Archived Logs"
        echo -e "   ${BLUE}3)${NC} ${CHART} Refresh Status"
    fi
    
    echo -e "   ${WHITE}0)${NC} ${CROSS} Exit Manager"
    echo
}

# Execute action
execute_action() {
    local action=$1
    local status=$(get_app_status)
    
    case $action in
        "1")
            if [ "$status" = "running" ] || [ "$status" = "port_occupied" ]; then
                echo -e "${YELLOW}Executing stop script...${NC}"
                echo
                cd "$(dirname "$SCRIPT_DIR")" && "$SCRIPT_DIR/app-stop.sh"
            else
                echo -e "${YELLOW}Executing start script...${NC}"
                echo
                cd "$(dirname "$SCRIPT_DIR")" && "$SCRIPT_DIR/app-start.sh"
            fi
            ;;
        "2")
            if [ "$status" = "running" ]; then
                echo -e "${YELLOW}Executing restart script...${NC}"
                echo
                cd "$(dirname "$SCRIPT_DIR")" && "$SCRIPT_DIR/app-restart.sh"
            elif [ "$status" = "port_occupied" ]; then
                echo -e "${YELLOW}Executing start script...${NC}"
                echo
                cd "$(dirname "$SCRIPT_DIR")" && "$SCRIPT_DIR/app-start.sh"
            else
                echo -e "${YELLOW}Viewing archived logs...${NC}"
                echo
                view_logs "archived"
            fi
            ;;
        "3")
            if [ "$status" = "running" ]; then
                echo -e "${YELLOW}Viewing current logs...${NC}"
                echo
                view_logs "current"
            else
                echo -e "${BLUE}Refreshing status...${NC}"
                sleep 1
                return 0
            fi
            ;;
        "4")
            if [ "$status" = "running" ]; then
                echo -e "${BLUE}Refreshing status...${NC}"
                sleep 1
                return 0
            fi
            ;;
        "0")
            echo -e "${GREEN}Goodbye! 👋${NC}"
            exit 0
            ;;
        *)
            echo -e "${RED}Invalid option. Please try again.${NC}"
            sleep 2
            return 0
            ;;
    esac
    
    echo
    echo -e "${YELLOW}Press any key to continue...${NC}"
    read -n 1 -s
}

# View logs
view_logs() {
    local log_type=$1
    
    if [ "$log_type" = "current" ]; then
        if [ -f "/tmp/tippingpoint-app.log" ]; then
            echo -e "${BLUE}Current Application Logs (last 50 lines):${NC}"
            echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
            tail -50 /tmp/tippingpoint-app.log
        else
            echo -e "${YELLOW}No current log file found.${NC}"
        fi
    else
        local archived_logs=$(ls -t /tmp/tippingpoint-app-*.log 2>/dev/null | head -5)
        if [ -n "$archived_logs" ]; then
            echo -e "${BLUE}Available Archived Logs:${NC}"
            echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
            echo "$archived_logs" | nl -w2 -s') '
            echo
            echo -e "${YELLOW}Enter log number to view (or press Enter to skip): ${NC}"
            read -r log_choice
            
            if [[ "$log_choice" =~ ^[0-9]+$ ]] && [ "$log_choice" -ge 1 ] && [ "$log_choice" -le 5 ]; then
                local selected_log=$(echo "$archived_logs" | sed -n "${log_choice}p")
                echo -e "${BLUE}Viewing: $selected_log (last 50 lines)${NC}"
                echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
                tail -50 "$selected_log"
            fi
        else
            echo -e "${YELLOW}No archived logs found.${NC}"
        fi
    fi
}

# Main interactive loop
main() {
    # Check if required scripts exist
    local required_scripts=("app-start.sh" "app-stop.sh" "app-restart.sh")
    local missing_scripts=()
    
    for script in "${required_scripts[@]}"; do
        if [ ! -f "$SCRIPT_DIR/$script" ]; then
            missing_scripts+=("$script")
        fi
    done
    
    if [ ${#missing_scripts[@]} -gt 0 ]; then
        print_banner
        echo -e "${RED}Missing required scripts:${NC}"
        for script in "${missing_scripts[@]}"; do
            echo -e "   ${CROSS} $SCRIPT_DIR/$script"
        done
        echo
        echo -e "${YELLOW}Please ensure all management scripts are present.${NC}"
        exit 1
    fi
    
    # Main interactive loop
    while true; do
        print_banner
        show_status
        show_urls
        show_menu
        
        echo -e "${CYAN}Select an action [0-4]: ${NC}"
        read -r choice
        
        echo
        execute_action "$choice"
    done
}

# Handle Ctrl+C gracefully
trap 'echo -e "\n${YELLOW}Manager interrupted. Goodbye! 👋${NC}"; exit 0' INT

# Run main function
main "$@"
