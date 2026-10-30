output "bucket_name" {
  description = "Name of the created storage bucket"
  value       = google_storage_bucket.app_storage.name
}

output "hello_world_url" {
  description = "Development application URL"
  value       = "http://${module.compute.external_ip}"
}

output "dev_vm_name" {
  value = module.compute.instance_name
}
