# The compute that runs the app: one Cloud Run service that scales to zero.
# Terraform owns its settings; the app pipeline only rolls out new images.

resource "google_service_account" "app" {
  account_id   = var.runtime_account_id
  display_name = "Runtime account of the dev web app"
}

resource "google_secret_manager_secret_iam_member" "app_reads" {
  for_each = toset(var.readable_secret_ids)

  secret_id = each.value
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.app.email}"
}

# The app saves and reads avatar photos in this one bucket, and nowhere else.
resource "google_storage_bucket_iam_member" "app_photos" {
  bucket = var.storage_bucket
  role   = "roles/storage.objectAdmin"
  member = "serviceAccount:${google_service_account.app.email}"
}

# Note: the Firestore permission (roles/datastore.user) is project-wide, so it is
# granted in infra/bootstrap, which a project Owner runs. The pipeline account
# is not allowed to change project-level access.

resource "google_cloud_run_v2_service" "app" {
  name                = var.service_name
  location            = var.region
  ingress             = "INGRESS_TRAFFIC_ALL"
  deletion_protection = false

  template {
    service_account = google_service_account.app.email

    scaling {
      min_instance_count = 0
      max_instance_count = var.max_instances
    }

    # Direct VPC egress: private traffic (to the data VM) goes through our subnet.
    vpc_access {
      network_interfaces {
        network    = var.network_name
        subnetwork = var.subnet_name
      }
      egress = "PRIVATE_RANGES_ONLY"
    }

    containers {
      name  = "web"
      image = var.initial_image

      ports {
        container_port = 8080
      }

      resources {
        limits = {
          cpu    = "1"
          memory = "512Mi"
        }
        cpu_idle = true
      }

      env {
        name  = "APP_ENV"
        value = var.environment
      }

      env {
        name  = "AUTH_TRUST_HOST"
        value = "true"
      }

      env {
        name  = "DATABASE_HOST"
        value = var.database_host
      }

      env {
        name  = "GCP_PROJECT_ID"
        value = var.project_id
      }

      env {
        name  = "GCS_BUCKET"
        value = var.storage_bucket
      }

      env {
        name  = "APP_URL"
        value = var.site_url
      }

      env {
        name  = "AUTH_URL"
        value = var.site_url
      }

      env {
        name = "RESEND_API_KEY"
        value_source {
          secret_key_ref {
            secret  = var.resend_api_key_secret_id
            version = "latest"
          }
        }
      }

      env {
        name  = "AUTH_GOOGLE_ID"
        value = var.google_client_id
      }

      env {
        name = "AUTH_GOOGLE_SECRET"
        value_source {
          secret_key_ref {
            secret  = var.google_client_secret_secret_id
            version = "latest"
          }
        }
      }

      env {
        name = "AUTH_SECRET"
        value_source {
          secret_key_ref {
            secret  = var.auth_secret_id
            version = "latest"
          }
        }
      }
    }
  }

  lifecycle {
    # The app pipeline rolls out a new image on every merge into main,
    # so Terraform does not reset the image or the deploy tool fields.
    ignore_changes = [
      template[0].containers[0].image,
      client,
      client_version,
    ]
  }

  depends_on = [
    google_secret_manager_secret_iam_member.app_reads,
    google_storage_bucket_iam_member.app_photos,
  ]
}

# Anyone can open the dev site (no custom domain needed).
resource "google_cloud_run_v2_service_iam_member" "public" {
  name     = google_cloud_run_v2_service.app.name
  location = google_cloud_run_v2_service.app.location
  role     = "roles/run.invoker"
  member   = "allUsers"
}
