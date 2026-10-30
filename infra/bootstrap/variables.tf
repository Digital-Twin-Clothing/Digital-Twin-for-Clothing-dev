variable "project_id" {
  description = "Google Cloud development project ID"
  type        = string
}

variable "state_bucket_name" {
  description = "Globally unique bucket name for Terraform state"
  type        = string
}

variable "location" {
  description = "Location of the Terraform state bucket"
  type        = string
  default     = "US"
}
