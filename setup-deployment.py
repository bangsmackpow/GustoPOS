#!/usr/bin/env python3
"""
Create airgapped-deployment directory and copy all deployment files
"""
import os
import shutil
from pathlib import Path

# Define paths
deploy_dir = Path(r"C:\Users\curtis\Desktop\dev\GustoPOS\airgapped-deployment")
source_dir = Path(r"C:\Users\curtis\.copilot\session-state\06d9c329-60ab-4bff-9c40-fcfe675f9eb9\files")

# Files to copy
files_to_copy = [
    "setup.sh",
    "start.sh",
    "stop.sh",
    "create-usb-bundle.sh",
    "SETUP_GUIDE_MACOS.md",
    "DEPLOYMENT_RUNBOOK.md",
    "DEPLOYMENT_SUMMARY.md",
    "POSTGRESQL_UPGRADE_PATH.md",
    "CONFIG_OVERRIDE_README.md",
]

def main():
    print("=" * 60)
    print("GustoPOS Airgapped Deployment Setup")
    print("=" * 60)
    
    # Create directory
    print(f"\nCreating directory: {deploy_dir}")
    deploy_dir.mkdir(parents=True, exist_ok=True)
    print(f"✓ Directory created/ready")
    
    # Copy files
    print(f"\nCopying files from: {source_dir}")
    copied_count = 0
    failed_count = 0
    
    for filename in files_to_copy:
        source_file = source_dir / filename
        dest_file = deploy_dir / filename
        
        if source_file.exists():
            try:
                shutil.copy2(source_file, dest_file)
                print(f"✓ {filename}")
                copied_count += 1
            except Exception as e:
                print(f"✗ {filename} - Error: {e}")
                failed_count += 1
        else:
            print(f"✗ {filename} - Source not found")
            failed_count += 1
    
    # Summary
    print("\n" + "=" * 60)
    print(f"Results: {copied_count} files copied, {failed_count} failed")
    print("=" * 60)
    
    # List directory contents
    print(f"\nDirectory contents ({deploy_dir}):")
    if deploy_dir.exists():
        contents = list(deploy_dir.iterdir())
        if contents:
            for item in sorted(contents):
                size = item.stat().st_size if item.is_file() else 0
                print(f"  {item.name} ({size} bytes)")
        else:
            print("  (empty)")
    
    return 0 if failed_count == 0 else 1

if __name__ == "__main__":
    exit(main())
