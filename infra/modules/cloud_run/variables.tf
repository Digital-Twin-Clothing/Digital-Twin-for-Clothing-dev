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
