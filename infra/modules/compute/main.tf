resource "google_compute_instance" "dev_vm" {
  name         = var.instance_name
  machine_type = var.machine_type
  zone         = var.zone

  tags = ["dev-web"]

  labels = {
    environment = "dev"
    project     = var.project_label
  }

  boot_disk {
    initialize_params {
      image = "debian-cloud/debian-12"
      size  = 20
      type  = "pd-standard"
    }
  }

  network_interface {
    subnetwork = var.subnet_id

    access_config {}
  }

  metadata_startup_script = <<-SCRIPT
    #!/bin/bash
    set -eux
    mkdir -p /opt/hello-world

    cat > /opt/hello-world/index.html <<'HTML'
    <!DOCTYPE html>
    <html>
    <head><title>Digital Twin Dev</title></head>
    <body>
      <h1>Hello World</h1>
      <p>Digital Twin for Clothing</p>
      <p>Environment: dev</p>
    </body>
    </html>
    HTML

    cat > /etc/systemd/system/hello-world.service <<'SERVICE'
    [Unit]
    Description=Temporary Hello World web server
    After=network.target

    [Service]
    Type=simple
    WorkingDirectory=/opt/hello-world
    ExecStart=/usr/bin/python3 -m http.server 80 --bind 0.0.0.0
    Restart=always

    [Install]
    WantedBy=multi-user.target
    SERVICE

    systemctl daemon-reload
    systemctl enable --now hello-world.service
  SCRIPT
}
