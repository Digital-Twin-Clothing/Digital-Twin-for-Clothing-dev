variable "service_name" {
  type = string
}

variable "region" {
  type = string
}

variable "environment" {
  type = string
}

variable "runtime_account_id" {
  type = string
}

variable "network_name" {
  type = string
}

variable "subnet_name" {
  type = string
}

variable "initial_image" {
  description = "Image used only when the service is first created; the app pipeline replaces it"
  type        = string
}

variable "max_instances" {
  type    = number
  default = 2
}

variable "database_host" {
  type = string
}

variable "auth_secret_id" {
  type = string
}

variable "readable_secret_ids" {
  description = "Secret Manager secrets the app may read"
  type        = list(string)
}

variable "project_id" {
  description = "Google Cloud project ID, used by the app to reach Firestore and Cloud Storage"
  type        = string
}

variable "storage_bucket" {
  description = "Private bucket where the app saves uploaded avatar photos"
  type        = string
}

variable "site_url" {
  description = "Public URL of the site, used in the links of verification emails"
  type        = string
}

variable "resend_api_key_secret_id" {
  description = "Secret Manager secret that holds the Resend API key for verification emails"
  type        = string
}
