#!/bin/bash
#
# GustoPOS Start Script
# Starts the API server and optionally frontend development server
#

set -e

GUSTO_HOME="${HOME}/.gustopos"
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

if [ ! -f "${GUSTO_HOME}/stack.env" ]; then
    echo "ERROR: stack.env not found in ${GUSTO_HOME}"
    echo "Please run setup.sh first"
    exit 1
fi

# Load configuration
source "${GUSTO_HOME}/stack.env"

# Ensure database directory exists
mkdir -p "${GUSTO_HOME}/data"
mkdir -p "${GUSTO_HOME}/logs"

# Set up logging
LOG_FILE="${GUSTO_HOME}/logs/server-$(date +%Y%m%d-%H%M%S).log"

echo "=========================================="
echo "GustoPOS Airgapped Server"
echo "=========================================="
echo "Time: $(date)"
echo "Database: ${DATABASE_URL}"
echo "Port: ${PORT:-3001}"
echo "Admin: ${ADMIN_EMAIL}"
echo "Log: ${LOG_FILE}"
echo ""
echo "Access the app at: http://localhost:3000"
echo "Press Ctrl+C to stop"
echo ""
echo "=========================================="
echo ""

# Export variables for subprocesses
export DATABASE_URL="file:${GUSTO_HOME}/data/gusto.db"
export PORT=${PORT:-3001}
export ADMIN_EMAIL
export ADMIN_PASSWORD
export ADMIN_PIN
export NODE_ENV=production
export LOG_LEVEL=${LOG_LEVEL:-info}

# Start API server
cd "${GUSTO_HOME}/api-server" 2>/dev/null || cd "${SCRIPT_DIR}/api-server" || {
    echo "ERROR: Could not find api-server directory"
    exit 1
}

# Run Node.js server with output to both console and log file
node --enable-source-maps dist/index.mjs 2>&1 | tee "${LOG_FILE}"
