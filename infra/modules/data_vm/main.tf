# One small private VM that runs the open-source data services of our
# architecture in containers, in place of managed services:
#   PostgreSQL (database), RabbitMQ (message broker), Redis (cache)
#   and a placeholder for the twin worker until the MVP build adds it.

resource "google_service_account" "data" {
  account_id   = var.runtime_account_id
  display_name = "Runtime account of the dev data VM"
}

resource "google_secret_manager_secret_iam_member" "data_reads_password" {
  secret_id = var.db_password_secret_id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.data.email}"
}

resource "google_compute_instance" "data" {
  name                      = var.instance_name
  machine_type              = var.machine_type
  zone                      = var.zone
  tags                      = ["dev-data"]
  allow_stopping_for_update = true

  labels = {
    role = "data"
  }

  boot_disk {
    initialize_params {
      image = "cos-cloud/cos-stable"
      size  = 10
      type  = "pd-standard"
    }
  }

  # No access_config block, so the VM gets no public IP.
  network_interface {
    subnetwork = var.subnet_id
  }

  service_account {
    email  = google_service_account.data.email
    scopes = ["cloud-platform"]
  }

  shielded_instance_config {
    enable_secure_boot = true
  }

  metadata = {
    enable-oslogin         = "TRUE"
    block-project-ssh-keys = "TRUE"
  }

  metadata_startup_script = templatefile("${path.module}/startup.sh.tftpl", {
    project_id            = var.project_id
    db_password_secret_id = var.db_password_secret_id
    db_name               = var.db_name
    db_user               = var.db_user
  })

  depends_on = [google_secret_manager_secret_iam_member.data_reads_password]
}
