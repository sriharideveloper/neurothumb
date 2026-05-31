#!/bin/bash

################################################################################
# Neurothumb - Automated Modal Setup Script
# Supports: macOS, Linux (Ubuntu, Debian, Fedora, Arch)
# 
# This script automates:
# 1. Python 3.11+ installation
# 2. Modal CLI installation
# 3. Modal authentication
# 4. Backend deployment
# 5. Endpoint extraction
# 6. .env.local generation
################################################################################

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
MODAL_BACKEND_DIR="modal_backend"
ENV_FILE=".env.local"
PYTHON_MIN_VERSION="3.11"

################################################################################
# Helper Functions
################################################################################

print_header() {
    echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║${NC} $1"
    echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

detect_os() {
    if [[ "$OSTYPE" == "darwin"* ]]; then
        echo "macos"
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        if [ -f /etc/os-release ]; then
            . /etc/os-release
            echo "$ID"
        else
            echo "linux"
        fi
    else
        echo "unknown"
    fi
}

check_python() {
    print_info "Checking Python installation..."
    
    if command -v python3 &> /dev/null; then
        PYTHON_VERSION=$(python3 --version 2>&1 | awk '{print $2}')
        print_success "Found Python $PYTHON_VERSION"
        
        # Check if version is >= 3.11
        MAJOR=$(echo $PYTHON_VERSION | cut -d. -f1)
        MINOR=$(echo $PYTHON_VERSION | cut -d. -f2)
        
        if [ "$MAJOR" -lt 3 ] || ([ "$MAJOR" -eq 3 ] && [ "$MINOR" -lt 11 ]); then
            print_warning "Python $PYTHON_VERSION is installed, but $PYTHON_MIN_VERSION+ is required"
            return 1
        fi
        return 0
    else
        print_warning "Python 3 is not installed"
        return 1
    fi
}

install_python() {
    local os=$1
    print_header "Installing Python 3.11+"
    
    case $os in
        macos)
            if command -v brew &> /dev/null; then
                print_info "Using Homebrew to install Python..."
                brew install python@3.11
                print_success "Python 3.11 installed via Homebrew"
            else
                print_error "Homebrew not found. Please install Python 3.11 manually:"
                echo "  Visit: https://www.python.org/downloads/"
                exit 1
            fi
            ;;
        ubuntu|debian)
            print_info "Using apt to install Python..."
            sudo apt-get update
            sudo apt-get install -y python3.11 python3.11-venv python3-pip
            print_success "Python 3.11 installed via apt"
            ;;
        fedora)
            print_info "Using dnf to install Python..."
            sudo dnf install -y python3.11 python3-pip
            print_success "Python 3.11 installed via dnf"
            ;;
        arch)
            print_info "Using pacman to install Python..."
            sudo pacman -S python
            print_success "Python installed via pacman"
            ;;
        *)
            print_error "Unsupported OS: $os"
            echo "Please install Python 3.11+ manually from https://www.python.org/downloads/"
            exit 1
            ;;
    esac
}

install_modal_cli() {
    print_header "Installing Modal CLI"
    
    if command -v modal &> /dev/null; then
        print_success "Modal CLI is already installed"
        return 0
    fi
    
    print_info "Installing Modal via pip..."
    pip3 install modal
    print_success "Modal CLI installed"
}

authenticate_modal() {
    print_header "Authenticating with Modal"
    
    if [ -f "$HOME/.modal/token" ]; then
        print_success "Modal token already exists"
        return 0
    fi
    
    print_info "Opening Modal authentication..."
    print_info "A browser window will open. Follow the instructions to create a token."
    
    modal token new
    
    if [ -f "$HOME/.modal/token" ]; then
        print_success "Modal authentication successful"
        return 0
    else
        print_error "Modal authentication failed"
        exit 1
    fi
}

deploy_backend() {
    print_header "Deploying Modal Backend"
    
    if [ ! -d "$MODAL_BACKEND_DIR" ]; then
        print_error "Modal backend directory not found: $MODAL_BACKEND_DIR"
        exit 1
    fi
    
    print_info "Installing backend dependencies..."
    pip3 install -r "$MODAL_BACKEND_DIR/requirements.txt"
    
    print_info "Deploying to Modal..."
    print_info "This may take 5-10 minutes on first deployment..."
    
    cd "$MODAL_BACKEND_DIR"
    modal deploy backend.py
    cd ..
    
    print_success "Backend deployed successfully"
}

extract_endpoints() {
    print_header "Extracting Modal Endpoints"
    
    print_info "Fetching deployment information..."
    
    # Get the Modal app name and username
    local modal_output=$(modal app list 2>/dev/null || echo "")
    
    if [ -z "$modal_output" ]; then
        print_warning "Could not automatically extract endpoints"
        print_info "Please manually add endpoints to .env.local:"
        echo "  MODAL_ENDPOINT_URL=https://your-username--crossaint-analyze.modal.run"
        echo "  MODAL_CHANNEL_ENDPOINT_URL=https://your-username--crossaint-analyze-channel.modal.run"
        return 1
    fi
    
    print_success "Endpoints extracted"
}

generate_env_file() {
    print_header "Generating .env.local"
    
    local endpoint_url="$1"
    local channel_endpoint_url="$2"
    
    if [ -f "$ENV_FILE" ]; then
        print_warning ".env.local already exists. Backing up to .env.local.bak"
        cp "$ENV_FILE" "$ENV_FILE.bak"
    fi
    
    cat > "$ENV_FILE" << EOF
# ============================================================================
# NEUROTHUMB - BYOK Configuration
# Generated by setup-modal.sh on $(date)
# ============================================================================

# Modal Configuration
MODAL_ENDPOINT_URL=${endpoint_url:-https://your-username--crossaint-analyze.modal.run}
	MODAL_CHANNEL_ENDPOINT_URL=${channel_endpoint_url:-https://your-username--crossaint-analyze-channel.modal.run}

# Supabase Configuration (REQUIRED - Add your credentials)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Gemini Configuration (OPTIONAL)
GEMINI_API_KEY=

# Modal Credentials (OPTIONAL - for programmatic deployment)
MODAL_TOKEN_ID=
MODAL_TOKEN_SECRET=
EOF
    
    print_success ".env.local generated"
    print_info "Please fill in the Supabase credentials in .env.local"
}

show_next_steps() {
    print_header "Setup Complete! 🎉"
    
    echo ""
    print_info "Next steps:"
    echo ""
    echo "  1. Configure Supabase credentials:"
    echo "     • Go to https://supabase.com and create a project"
    echo "     • Copy credentials to .env.local"
    echo ""
    echo "  2. Run database migrations:"
    echo "     • psql -h your-db-host -U postgres -f supabase_schema.sql"
    echo ""
    echo "  3. Start development server:"
    echo "     • pnpm install"
    echo "     • pnpm dev"
    echo ""
    echo "  4. Open http://localhost:3000 in your browser"
    echo ""
    print_info "For detailed setup instructions, see ENV_SETUP.md"
}

################################################################################
# Main Script
################################################################################

main() {
    print_header "Neurothumb - Modal Setup Script"
    
    # Detect OS
    OS=$(detect_os)
    print_info "Detected OS: $OS"
    
    # Check/Install Python
    if ! check_python; then
        read -p "Install Python 3.11+? (y/n) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            install_python "$OS"
        else
            print_error "Python 3.11+ is required"
            exit 1
        fi
    fi
    
    # Install Modal CLI
    install_modal_cli
    
    # Authenticate with Modal
    authenticate_modal
    
    # Deploy backend
    deploy_backend
    
    # Extract endpoints
    extract_endpoints
    
    # Generate .env.local
    generate_env_file
    
    # Show next steps
    show_next_steps
}

# Run main function
main "$@"
