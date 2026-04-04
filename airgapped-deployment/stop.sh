#!/bin/bash
#
# GustoPOS Stop Script
# Gracefully stops the API server
#

echo "Stopping GustoPOS..."

# Kill the Node.js process
if pgrep -f "node.*dist/index.mjs" > /dev/null; then
    pkill -f "node.*dist/index.mjs" || true
    sleep 2
    echo "✓ API server stopped"
else
    echo "API server not running"
fi

# If nginx is running, stop it too (if configured)
if command -v nginx &> /dev/null; then
    if pgrep -x "nginx" > /dev/null; then
        sudo nginx -s stop || sudo pkill -f nginx || true
        echo "✓ Nginx stopped"
    fi
fi

echo "Done."
