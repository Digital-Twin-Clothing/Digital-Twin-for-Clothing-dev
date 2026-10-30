resource "google_storage_bucket" "app_storage" {
  name                        = var.bucket_name
  location                    = "US"
  uniform_bucket_level_access = true
}


module "network" {
  source = "../../modules/network"

  network_name = var.network_name
  subnet_name  = var.subnet_name
  subnet_cidr  = var.subnet_cidr
  region       = var.region
}

module "compute" {
  source = "../../modules/compute"

  instance_name = var.instance_name
  machine_type  = var.machine_type
  zone          = var.zone
  subnet_id     = module.network.subnet_id
  project_label = var.project_label
}
