output "network_id" {
  value = google_compute_network.dev.id
}

output "subnet_id" {
  value = google_compute_subnetwork.dev.id
}
