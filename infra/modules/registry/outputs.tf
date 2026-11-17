output "repository_url" {
  description = "Image path prefix, for example <url>/web:<commit-sha>"
  value       = "${google_artifact_registry_repository.app.location}-docker.pkg.dev/${google_artifact_registry_repository.app.project}/${google_artifact_registry_repository.app.repository_id}"
}
