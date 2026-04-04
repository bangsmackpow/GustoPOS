#!/bin/bash
#
# GustoPOS USB Bundle Creator Script
# Run this on a development machine (with Node.js + pnpm installed) to create the USB bundle
#
# Usage: bash create-usb-bundle.sh [output-directory]
#
# This script:
# 1. Builds the GustoPOS application
# 2. Gathers all artifacts
# 3. Creates a self-contained bundle with Node.js runtime
# 4. Ready to copy to USB drive
#

set -e

OUTPUT_DIR="${1:-.}"
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

echo "=========================================="
echo "GustoPOS USB Bundle Creator"
echo "=========================================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Check prerequisites
echo -e "${YELLOW}[1/7] Checking prerequisites...${NC}"

if ! command -v node &> /dev/null; then
    echo -e "${RED}ERROR: Node.js not found. Install from https://nodejs.org/${NC}"
    exit 1
fi
NODE_VERSION=$(node --version)
echo -e "${GREEN}✓ Node.js ${NODE_VERSION}${NC}"

if ! command -v pnpm &> /dev/null; then
    echo -e "${RED}ERROR: pnpm not found. Install with: npm install -g pnpm${NC}"
    exit 1
fi
PNPM_VERSION=$(pnpm --version)
echo -e "${GREEN}✓ pnpm ${PNPM_VERSION}${NC}"

# Navigate to repo root
echo ""
echo -e "${YELLOW}[2/7] Building GustoPOS...${NC}"

cd "${SCRIPT_DIR}"

# Install dependencies
echo "  → Installing dependencies (this may take a few minutes)..."
pnpm install --frozen-lockfile

# Build all artifacts
echo "  → Building artifacts..."
pnpm run build

echo -e "${GREEN}✓ Build complete${NC}"

# Create bundle structure
echo ""
echo -e "${YELLOW}[3/7] Creating bundle structure...${NC}"

BUNDLE_DIR="${OUTPUT_DIR}/gusto-pos-macos-airgapped"
mkdir -p "${BUNDLE_DIR}"

echo -e "${GREEN}✓ Bundle directory: ${BUNDLE_DIR}${NC}"

# Copy built artifacts
echo ""
echo -e "${YELLOW}[4/7] Copying artifacts...${NC}"

echo "  → Copying API server..."
mkdir -p "${BUNDLE_DIR}/api-server"
cp -r artifacts/api-server/dist/* "${BUNDLE_DIR}/api-server/" || {
    echo -e "${RED}WARNING: api-server/dist not found. Build may have failed.${NC}"
}

echo "  → Copying frontend..."
mkdir -p "${BUNDLE_DIR}/gusto-pos"
cp -r artifacts/gusto-pos/dist/* "${BUNDLE_DIR}/gusto-pos/" || {
    echo -e "${RED}WARNING: gusto-pos/dist not found. Build may have failed.${NC}"
}

echo "  → Copying database migrations..."
mkdir -p "${BUNDLE_DIR}/migrations"
cp -r lib/db/migrations/* "${BUNDLE_DIR}/migrations/" || {
    echo -e "${YELLOW}WARNING: Migrations not found (may not be needed)${NC}"
}

echo -e "${GREEN}✓ Artifacts copied${NC}"

# Copy Node.js runtime (optional but recommended)
echo ""
echo -e "${YELLOW}[5/7] Bundling Node.js runtime...${NC}"

NODE_BIN=$(command -v node)
NODE_DIR=$(dirname ${NODE_BIN})
NODE_VERSION=$(node --version)

echo "  → Node.js location: ${NODE_BIN} (${NODE_VERSION})"
echo "  → This approach requires copying ~150MB of Node.js binaries"
echo "  → Alternative: Customer can install Node.js separately"

# Option A: Include full Node.js (recommended for airgapped)
if [ "${INCLUDE_NODE:-true}" = "true" ]; then
    echo "  → Copying Node.js binaries..."
    mkdir -p "${BUNDLE_DIR}/node"
    
    # Copy just the necessary binaries (smaller than full node_modules)
    cp "${NODE_BIN}" "${BUNDLE_DIR}/node/node"
    chmod +x "${BUNDLE_DIR}/node/node"
    
    echo -e "${GREEN}✓ Node.js bundled${NC}"
else
    echo -e "${YELLOW}! Node.js not bundled (customer will install separately)${NC}"
fi

# Copy scripts and documentation
echo ""
echo -e "${YELLOW}[6/7] Copying setup scripts and documentation...${NC}"

echo "  → setup.sh"
cp "${SCRIPT_DIR}/setup.sh" "${BUNDLE_DIR}/" || {
    # Fallback: create inline
    cp /dev/stdin "${BUNDLE_DIR}/setup.sh" << 'SETUP_INLINE'
#!/bin/bash
# Placeholder setup.sh - See SETUP_GUIDE_MACOS.md for full instructions
cd "$(dirname "$0")"
mkdir -p ~/.gustopos/data ~/.gustopos/logs
cp stack.env.example ~/.gustopos/stack.env
echo "✓ Setup complete. Edit ~/.gustopos/stack.env then run ./start.sh"
SETUP_INLINE
}
chmod +x "${BUNDLE_DIR}/setup.sh"

echo "  → start.sh"
cat > "${BUNDLE_DIR}/start.sh" << 'START_INLINE'
#!/bin/bash
GUSTO_HOME="${HOME}/.gustopos"
source "${GUSTO_HOME}/stack.env" 2>/dev/null || echo "WARNING: stack.env not found"
export DATABASE_URL="file:${GUSTO_HOME}/data/gusto.db"
mkdir -p "${GUSTO_HOME}/data" "${GUSTO_HOME}/logs"
cd "$(dirname "$0")/api-server"
node dist/index.mjs
START_INLINE
chmod +x "${BUNDLE_DIR}/start.sh"

echo "  → stop.sh"
cat > "${BUNDLE_DIR}/stop.sh" << 'STOP_INLINE'
#!/bin/bash
pkill -f "node.*dist/index" || echo "Process not running"
START_INLINE
chmod +x "${BUNDLE_DIR}/stop.sh"

echo "  → Documentation"
cp "${SCRIPT_DIR}/SETUP_GUIDE_MACOS.md" "${BUNDLE_DIR}/README.md" || {
    echo "# GustoPOS Setup Guide - See online documentation" > "${BUNDLE_DIR}/README.md"
}

echo "  → Configuration templates"
cp "${SCRIPT_DIR}/stack.env.example" "${BUNDLE_DIR}/stack.env.example" || {
    cat > "${BUNDLE_DIR}/stack.env.example" << 'STACK_ENV_INLINE'
PORT=3001
DATABASE_URL=file:~/.gustopos/data/gusto.db
ADMIN_EMAIL=admin@bar.local
ADMIN_PASSWORD=change-me
ADMIN_PIN=0000
ADMIN_SEED_ENABLED=true
LOG_LEVEL=info
STACK_ENV_INLINE
}

echo -e "${GREEN}✓ Scripts and documentation copied${NC}"

# Create manifest
echo ""
echo -e "${YELLOW}[7/7] Creating bundle manifest...${NC}"

cat > "${BUNDLE_DIR}/MANIFEST.txt" << MANIFEST_END
GustoPOS Airgapped Deployment Bundle
=====================================
Created: $(date)
Platform: macOS Monterey (requires macOS 10.13+)

Contents:
  • api-server/       - Express API server (compiled JavaScript)
  • gusto-pos/        - React frontend (pre-built static assets)
  • migrations/       - Database schema migrations
  • node/             - Node.js runtime (optional)
  • setup.sh          - Initial setup script
  • start.sh          - Start the application
  • stop.sh           - Stop the application
  • README.md         - Setup instructions
  • stack.env.example - Configuration template

Quick Start:
  1. bash setup.sh
  2. Edit ~/.gustopos/stack.env
  3. bash start.sh
  4. Open http://localhost:3000 in browser

Database:
  Location: ~/.gustopos/data/gusto.db
  Backup regularly to external USB drive!

System Requirements:
  • macOS Monterey (10.12.6) or later
  • $(node --version)
  • At least 1GB free disk space
  • No internet required (fully offline)

Support:
  See README.md for troubleshooting
  Check ~/.gustopos/logs/ for error details

MANIFEST_END

echo -e "${GREEN}✓ Manifest created${NC}"

# Summary
echo ""
echo "=========================================="
echo -e "${GREEN}✓ Bundle Ready!${NC}"
echo "=========================================="
echo ""
echo "Bundle location: ${BUNDLE_DIR}"
echo ""
echo "Next steps:"
echo "1. Copy the bundle to a USB drive:"
echo "   $ cp -r '${BUNDLE_DIR}' /Volumes/USB_DRIVE/"
echo ""
echo "2. Verify the bundle on USB:"
echo "   $ ls -la /Volumes/USB_DRIVE/gusto-pos-macos-airgapped/"
echo ""
echo "3. Give USB to customer with README.md instructions"
echo ""
echo "Bundle size:"
du -sh "${BUNDLE_DIR}"
echo ""
