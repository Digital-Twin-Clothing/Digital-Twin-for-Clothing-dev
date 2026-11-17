resource "google_artifact_registry_repository" "app" {
  location      = var.region
  repository_id = var.repository_id
  format        = "DOCKER"
  description   = "Docker images of the dev app, tagged with the commit SHA"
}
