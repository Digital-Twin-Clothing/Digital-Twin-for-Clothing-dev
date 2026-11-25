variable "project_id" {
  description = "Google Cloud project ID of the dev environment"
  type        = string
}

variable "environment" {
  description = "Environment name, used in labels and resource names"
  type        = string
}

variable "project_label" {
  description = "Value of the project label on every resource"
  type        = string
}

variable "region" {
  description = "Region for all regional resources"
  type        = string
}

variable "zone" {
  description = "Zone for the data VM"
  type        = string
}

variable "network_name" {
  type = string
}

variable "subnet_name" {
  type = string
}

variable "subnet_cidr" {
  type = string
}

variable "registry_name" {
  description = "Artifact Registry repository for the app images"
  type        = string
}

variable "service_name" {
  description = "Cloud Run service that runs the app"
  type        = string
}

variable "initial_image" {
  description = "Image used only if the service has to be created from scratch"
  type        = string
}

variable "data_vm_name" {
  type = string
}

variable "data_vm_machine_type" {
  description = "Smallest machine that runs the data containers"
  type        = string
}

variable "bucket_name" {
  description = "Globally unique name of the private app storage bucket"
  type        = string
}

variable "site_url" {
  description = "Public URL of the dev site, used in the links of verification emails"
  type        = string
}
