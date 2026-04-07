#!/bin/bash
# create-vbox-update.sh - Run this on a connected machine to create an update bundle

UPDATE_DIR="./gustopos-update-bundle"
IMAGES_FILE="$UPDATE_DIR/images.tar.gz"

echo "Creating GustoPOS Update Bundle..."
mkdir -p "$UPDATE_DIR/scripts"

# 1. Pull latest images from GitHub
echo "[1/4] Pulling latest images..."
docker-compose pull

# 2. Save images to a tarball
echo "[2/4] Saving images to $IMAGES_FILE (this may take a while)..."
# Extract image names from docker-compose
IMAGES=$(docker-compose config | grep 'image:' | awk '{print $2}' | sort | uniq)
docker save $IMAGES | gzip > "$IMAGES_FILE"

# 3. Copy latest configuration
echo "[3/4] Copying config files..."
cp docker-compose.yml "$UPDATE_DIR/"
cp airgapped-deployment/env.template "$UPDATE_DIR/"
cp airgapped-deployment/scripts/* "$UPDATE_DIR/scripts/"

# 4. Success
echo "[4/4] Done!"
echo "------------------------------------------------"
echo "Copy the '$UPDATE_DIR' folder to your USB drive."
echo "------------------------------------------------"
