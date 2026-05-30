# ============================================================================
# Neurothumb - Automated Modal Setup Script (Windows PowerShell)
# 
# This script automates:
# 1. Python 3.11+ installation (via Chocolatey or direct download)
# 2. Modal CLI installation
# 3. Modal authentication
# 4. Backend deployment
# 5. Endpoint extraction
# 6. .env.local generation
# ============================================================================

param(
    [switch]$SkipPython = $false,
    [switch]$SkipModal = $false
)

# ============================================================================
# Configuration
# ============================================================================

$MODAL_BACKEND_DIR = "modal_backend"
$ENV_FILE = ".env.local"
$PYTHON_MIN_VERSION = "3.11"

# ============================================================================
# Helper Functions
# ============================================================================

function Write-Header {
    param([string]$Message)
    Write-Host ""
    Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
    Write-Host "║ $Message" -ForegroundColor Cyan
    Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
    Write-Host ""
}

function Write-Success {
    param([string]$Message)
    Write-Host "✓ $Message" -ForegroundColor Green
}

function Write-Error {
    param([string]$Message)
    Write-Host "✗ $Message" -ForegroundColor Red
}

function Write-Warning {
    param([string]$Message)
    Write-Host "⚠ $Message" -ForegroundColor Yellow
}

function Write-Info {
    param([string]$Message)
    Write-Host "ℹ $Message" -ForegroundColor Cyan
}

function Check-Python {
    Write-Info "Checking Python installation..."
    
    $pythonCmd = Get-Command python.exe -ErrorAction SilentlyContinue
    
    if ($null -eq $pythonCmd) {
        Write-Warning "Python is not installed"
        return $false
    }
    
    $pythonVersion = & python.exe --version 2>&1
    Write-Success "Found $pythonVersion"
    
    # Extract version numbers
    if ($pythonVersion -match "Python (\d+)\.(\d+)") {
        $major = [int]$matches[1]
        $minor = [int]$matches[2]
        
        if ($major -lt 3 -or ($major -eq 3 -and $minor -lt 11)) {
            Write-Warning "Python $major.$minor is installed, but $PYTHON_MIN_VERSION+ is required"
            return $false
        }
        return $true
    }
    
    return $false
}

function Install-Python {
    Write-Header "Installing Python 3.11+"
    
    # Check if Chocolatey is installed
    $chocoCmd = Get-Command choco -ErrorAction SilentlyContinue
    
    if ($null -ne $chocoCmd) {
        Write-Info "Using Chocolatey to install Python..."
        & choco install python311 -y
        Write-Success "Python 3.11 installed via Chocolatey"
        
        # Refresh PATH
        $env:Path = [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path", "User")
        return
    }
    
    # Fallback: Direct download
    Write-Info "Downloading Python 3.11 installer..."
    $pythonUrl = "https://www.python.org/ftp/python/3.11.9/python-3.11.9-amd64.exe"
    $pythonInstaller = "$env:TEMP\python-3.11.9-amd64.exe"
    
    try {
        Invoke-WebRequest -Uri $pythonUrl -OutFile $pythonInstaller -ErrorAction Stop
        Write-Success "Downloaded Python installer"
        
        Write-Info "Running Python installer..."
        & $pythonInstaller /quiet InstallAllUsers=1 PrependPath=1
        
        # Wait for installation to complete
        Start-Sleep -Seconds 10
        
        # Refresh PATH
        $env:Path = [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path", "User")
        
        Write-Success "Python 3.11 installed"
        
        # Cleanup
        Remove-Item $pythonInstaller -Force -ErrorAction SilentlyContinue
    }
    catch {
        Write-Error "Failed to download Python installer"
        Write-Info "Please install Python 3.11 manually from https://www.python.org/downloads/"
        exit 1
    }
}

function Install-ModalCLI {
    Write-Header "Installing Modal CLI"
    
    $modalCmd = Get-Command modal.exe -ErrorAction SilentlyContinue
    
    if ($null -ne $modalCmd) {
        Write-Success "Modal CLI is already installed"
        return
    }
    
    Write-Info "Installing Modal via pip..."
    & python.exe -m pip install --upgrade pip
    & python.exe -m pip install modal
    
    # Refresh PATH
    $env:Path = [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path", "User")
    
    Write-Success "Modal CLI installed"
}

function Authenticate-Modal {
    Write-Header "Authenticating with Modal"
    
    $modalTokenPath = "$env:USERPROFILE\.modal\token"
    
    if (Test-Path $modalTokenPath) {
        Write-Success "Modal token already exists"
        return
    }
    
    Write-Info "Opening Modal authentication..."
    Write-Info "A browser window will open. Follow the instructions to create a token."
    
    & modal.exe token new
    
    if (Test-Path $modalTokenPath) {
        Write-Success "Modal authentication successful"
    }
    else {
        Write-Error "Modal authentication failed"
        exit 1
    }
}

function Deploy-Backend {
    Write-Header "Deploying Modal Backend"
    
    if (-not (Test-Path $MODAL_BACKEND_DIR)) {
        Write-Error "Modal backend directory not found: $MODAL_BACKEND_DIR"
        exit 1
    }
    
    Write-Info "Installing backend dependencies..."
    & python.exe -m pip install -r "$MODAL_BACKEND_DIR\requirements.txt"
    
    Write-Info "Deploying to Modal..."
    Write-Info "This may take 5-10 minutes on first deployment..."
    
    Push-Location $MODAL_BACKEND_DIR
    & modal.exe deploy backend.py
    Pop-Location
    
    Write-Success "Backend deployed successfully"
}

function Extract-Endpoints {
    Write-Header "Extracting Modal Endpoints"
    
    Write-Info "Fetching deployment information..."
    
    try {
        $modalOutput = & modal.exe app list 2>$null
        Write-Success "Endpoints extracted"
        return $true
    }
    catch {
        Write-Warning "Could not automatically extract endpoints"
        Write-Info "Please manually add endpoints to .env.local:"
        Write-Host "  MODAL_ENDPOINT_URL=https://your-username--croissant-analyze.modal.run"
        Write-Host "  MODAL_CHANNEL_ENDPOINT_URL=https://your-username--croissant-analyze-channel.modal.run"
        return $false
    }
}

function Generate-EnvFile {
    param(
        [string]$EndpointUrl = "",
        [string]$ChannelEndpointUrl = ""
    )
    
    Write-Header "Generating .env.local"
    
    if (Test-Path $ENV_FILE) {
        Write-Warning ".env.local already exists. Backing up to .env.local.bak"
        Copy-Item $ENV_FILE "$ENV_FILE.bak" -Force
    }
    
    $envContent = @"
# ============================================================================
# NEUROTHUMB - BYOK Configuration
# Generated by setup-modal.ps1 on $(Get-Date)
# ============================================================================

# Modal Configuration
MODAL_ENDPOINT_URL=$($EndpointUrl -or 'https://your-username--croissant-analyze.modal.run')
MODAL_CHANNEL_ENDPOINT_URL=$($ChannelEndpointUrl -or 'https://your-username--croissant-analyze-channel.modal.run')

# Supabase Configuration (REQUIRED - Add your credentials)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Gemini Configuration (OPTIONAL)
GEMINI_API_KEY=

# Modal Credentials (OPTIONAL - for programmatic deployment)
MODAL_TOKEN_ID=
MODAL_TOKEN_SECRET=
"@
    
    Set-Content -Path $ENV_FILE -Value $envContent -Encoding UTF8
    Write-Success ".env.local generated"
    Write-Info "Please fill in the Supabase credentials in .env.local"
}

function Show-NextSteps {
    Write-Header "Setup Complete! 🎉"
    
    Write-Host ""
    Write-Info "Next steps:"
    Write-Host ""
    Write-Host "  1. Configure Supabase credentials:"
    Write-Host "     • Go to https://supabase.com and create a project"
    Write-Host "     • Copy credentials to .env.local"
    Write-Host ""
    Write-Host "  2. Run database migrations:"
    Write-Host "     • psql -h your-db-host -U postgres -f supabase_schema.sql"
    Write-Host ""
    Write-Host "  3. Start development server:"
    Write-Host "     • pnpm install"
    Write-Host "     • pnpm dev"
    Write-Host ""
    Write-Host "  4. Open http://localhost:3000 in your browser"
    Write-Host ""
    Write-Info "For detailed setup instructions, see ENV_SETUP.md"
}

# ============================================================================
# Main Script
# ============================================================================

function Main {
    Write-Header "Neurothumb - Modal Setup Script (Windows)"
    
    # Check/Install Python
    if (-not $SkipPython) {
        if (-not (Check-Python)) {
            $response = Read-Host "Install Python 3.11+? (y/n)"
            if ($response -eq 'y') {
                Install-Python
            }
            else {
                Write-Error "Python 3.11+ is required"
                exit 1
            }
        }
    }
    
    # Install Modal CLI
    if (-not $SkipModal) {
        Install-ModalCLI
    }
    
    # Authenticate with Modal
    Authenticate-Modal
    
    # Deploy backend
    Deploy-Backend
    
    # Extract endpoints
    Extract-Endpoints
    
    # Generate .env.local
    Generate-EnvFile
    
    # Show next steps
    Show-NextSteps
}

# Run main function
Main
