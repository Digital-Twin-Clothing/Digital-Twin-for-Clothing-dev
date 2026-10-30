resource "google_compute_network" "dev" {
  name                    = var.network_name
  auto_create_subnetworks = false
}

resource "google_compute_subnetwork" "dev" {
  name          = var.subnet_name
  ip_cidr_range = var.subnet_cidr
  region        = var.region
  network       = google_compute_network.dev.id
}

resource "google_compute_firewall" "http" {
  name    = "${var.network_name}-allow-http"
  network = google_compute_network.dev.name

  allow {
    protocol = "tcp"
    ports    = ["80"]
  }

  source_ranges = ["0.0.0.0/0"]
  target_tags   = ["dev-web"]
}
