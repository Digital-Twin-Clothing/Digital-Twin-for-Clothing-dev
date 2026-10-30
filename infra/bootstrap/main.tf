terraform {
  required_version = "= 1.17.1"

  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "= 6.0.0"
    }
  }
}

provider "google" {
  project = var.project_id
}

resource "google_storage_bucket" "terraform_state" {
  name                        = var.state_bucket_name
  location                    = var.location
  uniform_bucket_level_access = true
  public_access_prevention    = "enforced"

  versioning {
    enabled = true
  }

  labels = {
    environment = "dev"
    project     = "digital-twin-for-clothing"
  }

  lifecycle {
    prevent_destroy = true
  }
}
