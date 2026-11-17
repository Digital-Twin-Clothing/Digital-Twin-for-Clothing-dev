output "state_bucket_name" {
  description = "Terraform remote state bucket for dev"
  value       = google_storage_bucket.terraform_state.name
}

output "workload_identity_provider" {
  description = "Value for workload_identity_provider in the GitHub workflows"
  value       = google_iam_workload_identity_pool_provider.github_dev.name
}

output "deployer_service_account" {
  description = "Value for service_account in the GitHub workflows"
  value       = google_service_account.deployer.email
}

output "project_number" {
  value = data.google_project.this.number
}
