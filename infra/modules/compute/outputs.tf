output "external_ip" {
  value = google_compute_instance.dev_vm.network_interface[0].access_config[0].nat_ip
}

output "instance_name" {
  value = google_compute_instance.dev_vm.name
}
