packer {
  required_plugins {
    virtualbox = {
      version = ">= 1.0.0"
      source  = "github.com/hashicorp/virtualbox"
    }
  }
}

variable "vm_name" {
  type    = string
  default = "gustopos-appliance-v1.0"
}

variable "iso_url" {
  type    = string
  default = "https://dl-cdn.alpinelinux.org/alpine/v3.19/releases/x86_64/alpine-standard-3.19.1-x86_64.iso"
}

variable "iso_checksum" {
  type    = string
  default = "sha256:aeda66b69f026d0e4c1c15e4b85eca6c02c3c0a59370b90667b40f0a5e6a09de"
}

variable "memory" {
  type    = string
  default = "2048"
}

variable "cpus" {
  type    = string
  default = "2"
}

variable "disk_size" {
  type    = string
  default = "20480"
}

source "virtualbox-iso" "gustopos" {
  vm_name      = var.vm_name
  iso_url      = var.iso_url
  iso_checksum = var.iso_checksum

  http_directory = "http"
  boot_wait      = "30s"
  boot_command = [
    "root<enter><wait>",
    "ifconfig eth0 up && udhcpc -i eth0<enter><wait>",
    "wget http://{{ .HTTPIP }}:{{ .HTTPPort }}/answers<enter><wait>",
    "setup-alpine -f answers<enter><wait5>",
    "reboot<enter>"
  ]

  shutdown_command = "poweroff"
  headless         = true

  memory              = var.memory
  cpus                = var.cpus
  disk_size           = var.disk_size
  guest_os_type       = "Linux_64"
  hard_drive_interface = "sata"

  # Network configuration
  vboxmanage = [
    ["modifyvm", "{{ .Name }}", "--nic1", "nat"],
    ["modifyvm", "{{ .Name }}", "--nic2", "hostonly"],
    ["modifyvm", "{{ .Name }}", "--hostonlyadapter2", "vboxnet0"]
  ]

  vboxmanage_post = [
    ["modifyvm", "{{ .Name }}", "--memory", var.memory],
    ["modifyvm", "{{ .Name }}", "--cpus", var.cpus]
  ]
}

build {
  name = "gustopos-appliance"

  sources = [
    "source.virtualbox-iso.gustopos"
  ]

  # Wait for system to boot
  provisioner "shell" {
    inline = [
      "echo 'Waiting for system to stabilize...'",
      "sleep 10"
    ]
  }

  # Update Alpine Linux
  provisioner "shell" {
    inline = [
      "apk update",
      "apk upgrade",
      "apk add docker docker-compose openssh ca-certificates curl wget tzdata"
    ]
  }

  # Enable Docker service
  provisioner "shell" {
    inline = [
      "rc-service docker start",
      "rc-update add docker default"
    ]
  }

  # Create data directories
  provisioner "shell" {
    inline = [
      "mkdir -p /data/{db,logs,backups}",
      "mkdir -p /etc/gustopos",
      "mkdir -p /opt/gustopos/scripts"
    ]
  }

  # Copy docker-compose configuration
  provisioner "file" {
    source      = "../docker-compose.yml"
    destination = "/etc/gustopos/docker-compose.yml"
  }

  # Copy helper scripts
  provisioner "file" {
    source      = "scripts/"
    destination = "/opt/gustopos/scripts"
  }

  # Copy environment template
  provisioner "file" {
    source      = "env.template"
    destination = "/etc/gustopos/.env.template"
  }

  # Create init service
  provisioner "shell" {
    inline = [
      "cat > /etc/init.d/gustopos << 'EOF'",
      "#!/sbin/openrc-run",
      "",
      "description=\"GustoPOS Application Stack\"",
      "supervisor=\"supervise-daemon\"",
      "",
      "depend() {",
      "    need docker",
      "    after docker",
      "}",
      "",
      "start() {",
      "    cd /opt/gustopos",
      "    docker-compose -f /etc/gustopos/docker-compose.yml up -d",
      "}",
      "",
      "stop() {",
      "    cd /opt/gustopos",
      "    docker-compose -f /etc/gustopos/docker-compose.yml down",
      "}",
      "EOF",
      "chmod +x /etc/init.d/gustopos",
      "rc-update add gustopos default"
    ]
  }

  # Create first-boot setup script
  provisioner "shell" {
    inline = [
      "cat > /usr/local/bin/gustopos-init << 'INIT'",
      "#!/bin/sh",
      "set -e",
      "echo 'GustoPOS First-Time Setup'",
      "echo 'Generating SSL certificates...'",
      "mkdir -p /etc/gustopos/ssl",
      "openssl req -x509 -newkey rsa:4096 -keyout /etc/gustopos/ssl/key.pem -out /etc/gustopos/ssl/cert.pem -days 365 -nodes -subj '/CN=gustopos.local' 2>/dev/null || true",
      "echo 'Creating .env file from template...'",
      "if [ ! -f /etc/gustopos/.env ]; then",
      "  cp /etc/gustopos/.env.template /etc/gustopos/.env",
      "  echo 'Environment file created. Edit /etc/gustopos/.env before starting containers.'",
      "fi",
      "echo 'Setup complete!'",
      "INIT",
      "chmod +x /usr/local/bin/gustopos-init"
    ]
  }

  # Cleanup
  provisioner "shell" {
    inline = [
      "apk cache clean",
      "rm -rf /tmp/*",
      "echo 'Image build complete!'"
    ]
  }

  # Generate OVA file
  post-processor "manifest" {
    output     = "manifest.json"
    strip_path = true
  }
}
