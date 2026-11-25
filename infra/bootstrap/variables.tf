variable "project_id" {
  description = "Google Cloud project ID of the dev environment"
  type        = string
  default     = "digital-twin-clothing"
}

variable "region" {
  description = "Default region"
  type        = string
  default     = "us-east4"
}

variable "state_bucket_name" {
  description = "Globally unique bucket name for the Terraform state of dev"
  type        = string
  default     = "digital-twin-clothing-tfstate"
}

variable "state_bucket_location" {
  description = "Location of the Terraform state bucket"
  type        = string
  default     = "US-EAST4"
}

variable "github_repository" {
  description = "The only GitHub repository allowed to sign in (owner/name)"
  type        = string
  default     = "Digital-Twin-Clothing/Digital-Twin-for-Clothing-dev"
}

variable "apis" {
  description = "Google Cloud APIs used by the dev environment and the pipelines"
  type        = list(string)
  default = [
    "artifactregistry.googleapis.com",
    "cloudresourcemanager.googleapis.com",
    "compute.googleapis.com",
    "datastore.googleapis.com",
    "firestore.googleapis.com",
    "iam.googleapis.com",
    "iamcredentials.googleapis.com",
    "run.googleapis.com",
    "secretmanager.googleapis.com",
    "serviceusage.googleapis.com",
    "sts.googleapis.com",
    "storage.googleapis.com",
  ]
}

variable "deployer_roles" {
  description = "Project roles for the pipeline service account (only what the dev Terraform and deploys need)"
  type        = list(string)
  default = [
    "roles/artifactregistry.admin",
    "roles/compute.admin",
    "roles/iam.serviceAccountAdmin",
    "roles/iam.serviceAccountUser",
    "roles/run.admin",
    "roles/secretmanager.admin",
    "roles/serviceusage.serviceUsageConsumer",
    "roles/storage.admin",
  ]
}

variable "app_runtime_account_email" {
  description = "Service account the Cloud Run app runs as (created by the dev environment)"
  type        = string
  default     = "web-app-dev@digital-twin-clothing.iam.gserviceaccount.com"
}
