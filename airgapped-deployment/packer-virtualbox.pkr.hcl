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
  default = "https://cdimage.debian.org/cdimage/archive/12.13.0/amd64/iso-cd/debian-12.13.0-amd64-netinst.iso"
}

variable "iso_checksum" {
  type    = string
  default = "sha256:2b880ffabe36dbe04a662a3125e5ecae4db69d0acce257dd74615bbf165ad76e"
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

  http_directory = "${path.root}/http"
  boot_wait      = "5s"
  boot_command = [
    "<esc><wait>",
    "install auto=true priority=critical vga=788 netcfg/get_hostname=gustopos netcfg/get_domain=local url=http://{{ .HTTPIP }}:{{ .HTTPPort }}/preseed.cfg locale=en_US.UTF-8 keymap=us console-setup/ask_detect=false fb=false hw-detect/start_pcmcia=false<enter>"
  ]

  shutdown_command = "echo 'gustopos' | sudo -S poweroff"
  headless         = true

  ssh_username = "gustopos"
  ssh_password = "gustopos"
  ssh_timeout  = "60m"
  ssh_handshake_attempts = 1000

  memory              = var.memory
  cpus                = var.cpus
  disk_size           = var.disk_size
  guest_os_type       = "Debian_64"
  hard_drive_interface = "sata"

  # Standard VirtualBox settings for Debian
  vboxmanage = [
    ["modifyvm", "{{ .Name }}", "--nic1", "nat"],
    ["modifyvm", "{{ .Name }}", "--nictype1", "82540EM"],
    ["modifyvm", "{{ .Name }}", "--audio", "none"],
    ["modifyvm", "{{ .Name }}", "--usb", "off"],
    ["modifyvm", "{{ .Name }}", "--graphicscontroller", "vmsvga"]
  ]
}

build {
  name = "gustopos-appliance"

  sources = [
    "source.virtualbox-iso.gustopos"
  ]

  # Pre-pull and setup logic for Debian (Systemd)
  provisioner "shell" {
    inline = [
      "echo 'Waiting for apt lock...'",
      "while sudo fuser /var/lib/dpkg/lock-frontend >/dev/null 2>&1; do sleep 1; done",
      "sudo apt-get update",
      "sudo apt-get install -y docker.io docker-compose sqlite3 openssl",
      "sudo systemctl enable docker",
      "sudo systemctl start docker"
    ]
  }

  provisioner "shell" {
    inline = [
      "sudo mkdir -p /data/db /data/logs /data/backups",
      "sudo mkdir -p /etc/gustopos/ssl",
      "sudo mkdir -p /opt/gustopos/scripts",
      "sudo chown -R gustopos:gustopos /data /etc/gustopos /opt/gustopos"
    ]
  }

  provisioner "file" {
    source      = "${path.root}/../docker-compose.yml"
    destination = "/etc/gustopos/docker-compose.yml"
  }

  provisioner "file" {
    source      = "${path.root}/scripts/"
    destination = "/opt/gustopos/scripts/"
  }

  provisioner "file" {
    source      = "${path.root}/env.template"
    destination = "/etc/gustopos/.env.template"
  }

  # Pre-pull Docker images
  provisioner "shell" {
    inline = [
      "cd /etc/gustopos",
      "sudo cp .env.template stack.env",
      "sudo docker-compose pull"
    ]
  }

  # Link scripts
  provisioner "shell" {
    inline = [
      "sudo chmod +x /opt/gustopos/scripts/*",
      "for script in init start stop logs backup restore help update; do",
      "  sudo ln -sf /opt/gustopos/scripts/gustopos-$script /usr/local/bin/gustopos-$script",
      "done"
    ]
  }

  # Create Systemd unit instead of OpenRC
  provisioner "shell" {
    inline = [
      "cat << 'EOF' | sudo tee /etc/systemd/system/gustopos.service",
      "[Unit]",
      "Description=GustoPOS Application Stack",
      "After=docker.service",
      "Requires=docker.service",
      "",
      "[Service]",
      "Type=oneshot",
      "RemainAfterExit=yes",
      "WorkingDirectory=/etc/gustopos",
      "ExecStartPre=/bin/bash -c 'if [ ! -f /etc/gustopos/.env ]; then /usr/local/bin/gustopos-init; fi'",
      "ExecStart=/usr/bin/docker-compose up -d",
      "ExecStop=/usr/bin/docker-compose down",
      "",
      "[Install]",
      "WantedBy=multi-user.target",
      "EOF",
      "sudo systemctl enable gustopos"
    ]
  }

  # Final cleanup
  provisioner "shell" {
    inline = [
      "sudo apt-get clean",
      "sudo rm -rf /var/lib/apt/lists/*"
    ]
  }

  post-processor "manifest" {
    output     = "manifest.json"
    strip_path = true
  }
}
