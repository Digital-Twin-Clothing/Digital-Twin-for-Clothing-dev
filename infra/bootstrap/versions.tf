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
  region  = var.region

  default_labels = {
    environment = "dev"
    project     = "digital-twin-for-clothing"
  }
}
