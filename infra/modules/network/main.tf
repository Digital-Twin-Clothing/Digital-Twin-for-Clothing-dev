resource "google_compute_network" "dev" {
  name                    = var.network_name
  auto_create_subnetworks = false
}

resource "google_compute_subnetwork" "dev" {
  name                     = var.subnet_name
  ip_cidr_range            = var.subnet_cidr
  region                   = var.region
  network                  = google_compute_network.dev.id
  private_ip_google_access = true
}

# The data VM has no public IP. Only the app (Cloud Run, through this subnet)
# can reach PostgreSQL, RabbitMQ and Redis.
resource "google_compute_firewall" "data_from_subnet" {
  name    = "${var.network_name}-allow-data-from-subnet"
  network = google_compute_network.dev.name

  allow {
    protocol = "tcp"
    ports    = ["5432", "5672", "6379"]
  }

  source_ranges = [var.subnet_cidr]
  target_tags   = ["dev-data"]
}

# SSH to the data VM only through Google's Identity-Aware Proxy, for admins.
resource "google_compute_firewall" "ssh_from_iap" {
  name    = "${var.network_name}-allow-ssh-from-iap"
  network = google_compute_network.dev.name

  allow {
    protocol = "tcp"
    ports    = ["22"]
  }

  source_ranges = ["35.235.240.0/20"]
  target_tags   = ["dev-data"]
}

# Outbound internet for the data VM (to pull open-source images) without a public IP.
resource "google_compute_router" "dev" {
  name    = "${var.network_name}-router"
  region  = var.region
  network = google_compute_network.dev.id
}

resource "google_compute_router_nat" "dev" {
  name                               = "${var.network_name}-nat"
  router                             = google_compute_router.dev.name
  region                             = var.region
  nat_ip_allocate_option             = "AUTO_ONLY"
  source_subnetwork_ip_ranges_to_nat = "ALL_SUBNETWORKS_ALL_IP_RANGES"
}
