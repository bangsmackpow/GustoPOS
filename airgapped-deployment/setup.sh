#!/bin/bash
#
# GustoPOS Airgapped Setup Script for macOS
# This script prepares GustoPOS to run on a disconnected MacBook Pro
#
# Usage: ./setup.sh
#

set -e

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
GUSTO_HOME="${HOME}/.gustopos"
LOG_FILE="${GUSTO_HOME}/setup.log"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo "=========================================="
echo "GustoPOS Airgapped Setup"
echo "=========================================="
echo "Log file: ${LOG_FILE}"
echo ""

# Create GustoPOS home directory
mkdir -p "${GUSTO_HOME}" 2>/dev/null || true
mkdir -p "${GUSTO_HOME}/data" 2>/dev/null || true
mkdir -p "${GUSTO_HOME}/logs" 2>/dev/null || true

# Redirect output to log file (but also show to user)
exec 1> >(tee -a "${LOG_FILE}")
exec 2>&1

echo "[$(date)] Starting GustoPOS setup..."

# Step 1: Check for Node.js
echo ""
echo -e "${YELLOW}[1/5] Checking Node.js...${NC}"
if ! command -v node &> /dev/null; then
    echo -e "${RED}ERROR: Node.js not found${NC}"
    echo "Please ensure Node.js is installed and accessible in PATH"
    exit 1
fi

NODE_VERSION=$(node --version)
echo -e "${GREEN}✓ Node.js ${NODE_VERSION} found${NC}"

# Step 2: Check for pnpm
echo ""
echo -e "${YELLOW}[2/5] Checking pnpm...${NC}"
if ! command -v pnpm &> /dev/null; then
    echo -e "${RED}ERROR: pnpm not found${NC}"
    echo "Installing pnpm locally..."
    npm install -g pnpm || {
        echo "Failed to install pnpm. Please install manually:"
        echo "  npm install -g pnpm"
        exit 1
    }
fi

PNPM_VERSION=$(pnpm --version)
echo -e "${GREEN}✓ pnpm ${PNPM_VERSION} found${NC}"

# Step 3: Setup environment
echo ""
echo -e "${YELLOW}[3/5] Setting up configuration...${NC}"

if [ ! -f "${GUSTO_HOME}/stack.env" ]; then
    echo "Creating default stack.env..."
    cat > "${GUSTO_HOME}/stack.env" << 'EOF'
# GustoPOS Environment Configuration
# Airgapped macOS Deployment

# API Server Configuration
PORT=3001
API_HOST=127.0.0.1
API_URL=http://localhost:3001

# Database Configuration (Local SQLite)
DATABASE_URL=file:${GUSTO_HOME}/data/gusto.db

# Admin Credentials (CHANGE THESE!)
ADMIN_EMAIL=admin@bar.local
ADMIN_PASSWORD=change-me-immediately
ADMIN_PIN=0000

# Features
ADMIN_LOGIN_ENABLED=true
ADMIN_SEED_ENABLED=true

# Logging
LOG_LEVEL=info

# Offline Mode (No Litestream, No Cloud Sync)
LITESTREAM_REPLICA_URL=
LITESTREAM_ENDPOINT=
LITESTREAM_ACCESS_KEY_ID=
LITESTREAM_SECRET_ACCESS_KEY=

# Email (Optional - leave blank to disable)
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASSWORD=
EOF
    echo -e "${GREEN}✓ Created default stack.env${NC}"
    echo "  → Please edit: ${GUSTO_HOME}/stack.env"
    echo "  → Set ADMIN_PASSWORD to something secure"
else
    echo -e "${GREEN}✓ stack.env already exists (not overwriting)${NC}"
fi

# Step 4: Copy app files
echo ""
echo -e "${YELLOW}[4/5] Copying application files...${NC}"

if [ ! -d "${SCRIPT_DIR}/api-server" ]; then
    echo -e "${RED}ERROR: api-server not found in USB bundle${NC}"
    exit 1
fi

if [ ! -d "${SCRIPT_DIR}/gusto-pos" ]; then
    echo -e "${RED}ERROR: gusto-pos not found in USB bundle${NC}"
    exit 1
fi

# Copy app to home directory (symlink is more efficient)
ln -sf "${SCRIPT_DIR}/api-server" "${GUSTO_HOME}/api-server" 2>/dev/null || cp -r "${SCRIPT_DIR}/api-server" "${GUSTO_HOME}/"
ln -sf "${SCRIPT_DIR}/gusto-pos" "${GUSTO_HOME}/gusto-pos" 2>/dev/null || cp -r "${SCRIPT_DIR}/gusto-pos" "${GUSTO_HOME}/"

echo -e "${GREEN}✓ Application files ready${NC}"
echo "  → API: ${GUSTO_HOME}/api-server"
echo "  → Frontend: ${GUSTO_HOME}/gusto-pos"

# Step 5: Create startup/stop scripts
echo ""
echo -e "${YELLOW}[5/5] Creating helper scripts...${NC}"

# Create start.sh
cat > "${GUSTO_HOME}/start.sh" << 'EOF'
#!/bin/bash
GUSTO_HOME="${HOME}/.gustopos"
source "${GUSTO_HOME}/stack.env"

cd "${GUSTO_HOME}/api-server"
export DATABASE_URL="file:${GUSTO_HOME}/data/gusto.db"
export PORT=3001

echo "[$(date)] Starting GustoPOS..."
echo "  API Server: http://localhost:${PORT}"
echo "  Frontend: http://localhost:3000"
echo "  Database: ${DATABASE_URL}"
echo ""
echo "Press Ctrl+C to stop"
echo ""

node dist/index.mjs
EOF

# Create stop.sh
cat > "${GUSTO_HOME}/stop.sh" << 'EOF'
#!/bin/bash
echo "Stopping GustoPOS..."
pkill -f "node dist/index.mjs" || echo "Process not running"
sleep 1
echo "Stopped."
EOF

chmod +x "${GUSTO_HOME}/start.sh" 2>/dev/null || true
chmod +x "${GUSTO_HOME}/stop.sh" 2>/dev/null || true

echo -e "${GREEN}✓ Helper scripts created${NC}"
echo "  → Start: ${GUSTO_HOME}/start.sh"
echo "  → Stop: ${GUSTO_HOME}/stop.sh"

# Summary
echo ""
echo "=========================================="
echo -e "${GREEN}✓ Setup Complete!${NC}"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. Edit configuration:"
echo "   → open ${GUSTO_HOME}/stack.env"
echo "   → Set ADMIN_PASSWORD to something secure"
echo ""
echo "2. Start the application:"
echo "   → ${GUSTO_HOME}/start.sh"
echo ""
echo "3. Access in browser:"
echo "   → http://localhost:3000"
echo ""
echo "4. Stop the application:"
echo "   → ${GUSTO_HOME}/stop.sh"
echo ""
echo "Log files:"
echo "   → ${LOG_FILE}"
echo "   → ${GUSTO_HOME}/logs/"
echo ""
