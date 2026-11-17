terraform {
  required_version = "= 1.17.1"

  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "= 6.0.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "= 3.6.3"
    }
  }
}

provider "google" {
  project = var.project_id
  region  = var.region
  zone    = var.zone

  # Every resource that supports labels gets these two.
  default_labels = {
    environment = var.environment
    project     = var.project_label
  }
}
