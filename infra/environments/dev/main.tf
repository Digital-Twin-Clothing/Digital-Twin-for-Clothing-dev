# The dev environment, built from our submitted architecture and scaled down
# for cost. The README maps each architecture component to the code below.

module "network" {
  source = "../../modules/network"

  network_name = var.network_name
  subnet_name  = var.subnet_name
  subnet_cidr  = var.subnet_cidr
  region       = var.region
}

module "registry" {
  source = "../../modules/registry"

  region        = var.region
  repository_id = var.registry_name
}

module "data" {
  source = "../../modules/data_vm"

  project_id            = var.project_id
  instance_name         = var.data_vm_name
  machine_type          = var.data_vm_machine_type
  zone                  = var.zone
  subnet_id             = module.network.subnet_id
  runtime_account_id    = "data-vm-${var.environment}"
  db_password_secret_id = google_secret_manager_secret.db_password.secret_id

  # The VM reads the password when it boots, so the value must exist first.
  depends_on = [google_secret_manager_secret_version.db_password]
}

module "app" {
  source = "../../modules/cloud_run"

  service_name       = var.service_name
  region             = var.region
  environment        = var.environment
  runtime_account_id = "web-app-${var.environment}"
  network_name       = module.network.network_name
  subnet_name        = module.network.subnet_name
  initial_image      = var.initial_image
  database_host      = module.data.internal_ip
  auth_secret_id     = google_secret_manager_secret.auth_secret.secret_id
  readable_secret_ids = [
    google_secret_manager_secret.auth_secret.secret_id,
    google_secret_manager_secret.db_password.secret_id,
  ]

  # The app must not start before its secret has a value.
  depends_on = [google_secret_manager_secret_version.auth_secret]
}

# Private storage for photos and avatar files.
resource "google_storage_bucket" "app_storage" {
  name                        = var.bucket_name
  location                    = upper(var.region)
  uniform_bucket_level_access = true
  public_access_prevention    = "enforced"
  force_destroy               = true # dev only, so terraform destroy can clean up after grading
}
