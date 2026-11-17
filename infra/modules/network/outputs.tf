output "network_id" {
  value = google_compute_network.dev.id
}

output "subnet_id" {
  value = google_compute_subnetwork.dev.id
}

output "network_name" {
  value = google_compute_network.dev.name
}

output "subnet_name" {
  value = google_compute_subnetwork.dev.name
}
