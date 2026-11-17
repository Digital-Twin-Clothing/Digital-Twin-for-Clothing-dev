variable "project_id" {
  type = string
}

variable "instance_name" {
  type = string
}

variable "machine_type" {
  type = string
}

variable "zone" {
  type = string
}

variable "subnet_id" {
  type = string
}

variable "runtime_account_id" {
  type = string
}

variable "db_password_secret_id" {
  type = string
}

variable "db_name" {
  type    = string
  default = "digitaltwin"
}

variable "db_user" {
  type    = string
  default = "app"
}
