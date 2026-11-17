# One-time setup for the dev project, run by a project Owner from Cloud Shell.
# It creates what the pipelines need before they can run on their own:
#   1. the Google Cloud APIs the dev environment uses
#   2. the bucket that stores the Terraform state for dev
#   3. keyless sign-in for GitHub Actions (Workload Identity Federation),
#      trusted only for the dev repository
#   4. the service account the pipelines act as
# Its own state stays local in Cloud Shell; see README "One-time setup".

data "google_project" "this" {
  project_id = var.project_id
}

resource "google_project_service" "apis" {
  for_each = toset(var.apis)

  project            = var.project_id
  service            = each.value
  disable_on_destroy = false
}

resource "google_storage_bucket" "terraform_state" {
  name                        = var.state_bucket_name
  location                    = var.state_bucket_location
  uniform_bucket_level_access = true
  public_access_prevention    = "enforced"

  versioning {
    enabled = true
  }

  lifecycle {
    prevent_destroy = true
  }

  depends_on = [google_project_service.apis]
}

resource "google_iam_workload_identity_pool" "github" {
  workload_identity_pool_id = "github"
  display_name              = "GitHub Actions"
  description               = "Keyless sign-in for GitHub Actions in the dev repository"

  depends_on = [google_project_service.apis]
}

resource "google_iam_workload_identity_pool_provider" "github_dev" {
  workload_identity_pool_id          = google_iam_workload_identity_pool.github.workload_identity_pool_id
  workload_identity_pool_provider_id = "github-dev"
  display_name                       = "GitHub dev repository"

  attribute_mapping = {
    "google.subject"       = "assertion.sub"
    "attribute.repository" = "assertion.repository"
    "attribute.ref"        = "assertion.ref"
  }

  # Only tokens issued for our dev repository are accepted.
  attribute_condition = "assertion.repository == '${var.github_repository}'"

  oidc {
    issuer_uri = "https://token.actions.githubusercontent.com"
  }
}

resource "google_service_account" "deployer" {
  account_id   = "github-deployer"
  display_name = "GitHub Actions deployer (dev)"
  description  = "Used by the infrastructure and app pipelines of the dev repository"

  depends_on = [google_project_service.apis]
}

resource "google_project_iam_member" "deployer" {
  for_each = toset(var.deployer_roles)

  project = var.project_id
  role    = each.value
  member  = "serviceAccount:${google_service_account.deployer.email}"
}

# GitHub Actions runs from the dev repository may act as the deployer account.
resource "google_service_account_iam_member" "github_dev_repo" {
  service_account_id = google_service_account.deployer.name
  role               = "roles/iam.workloadIdentityUser"
  member             = "principalSet://iam.googleapis.com/${google_iam_workload_identity_pool.github.name}/attribute.repository/${var.github_repository}"
}
