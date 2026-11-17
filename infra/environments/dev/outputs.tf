output "hello_world_url" {
  description = "Hello World app on Cloud Run (the provider's default URL)"
  value       = module.app.url
}

output "image_repository" {
  description = "Where the app pipeline pushes images, tagged with the commit SHA"
  value       = module.registry.repository_url
}

output "data_vm_internal_ip" {
  description = "Private address of PostgreSQL, RabbitMQ and Redis"
  value       = module.data.internal_ip
}

output "app_bucket" {
  value = google_storage_bucket.app_storage.name
}
