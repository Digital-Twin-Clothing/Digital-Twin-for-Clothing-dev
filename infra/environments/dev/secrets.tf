# Secrets are generated here and stored in Secret Manager. They never appear
# in the code or in dev.tfvars; the app and the data VM read them at runtime.

resource "random_password" "auth_secret" {
  length  = 48
  special = false
}

resource "google_secret_manager_secret" "auth_secret" {
  secret_id = "auth-secret-${var.environment}"

  replication {
    auto {}
  }
}

resource "google_secret_manager_secret_version" "auth_secret" {
  secret      = google_secret_manager_secret.auth_secret.id
  secret_data = random_password.auth_secret.result
}

resource "random_password" "db_password" {
  length  = 32
  special = false
}

resource "google_secret_manager_secret" "db_password" {
  secret_id = "db-password-${var.environment}"

  replication {
    auto {}
  }
}

resource "google_secret_manager_secret_version" "db_password" {
  secret      = google_secret_manager_secret.db_password.id
  secret_data = random_password.db_password.result
}

# API key of the email service (Resend) that sends the verification links.
# Terraform creates the secret with a placeholder value only. The real key is
# added by hand and never goes into the code or the Terraform state:
#   printf '%s' 're_xxxxxxxx' | gcloud secrets versions add resend-api-key-dev --data-file=-
# Terraform ignores later changes to the value, so it will not overwrite the real key.
resource "google_secret_manager_secret" "resend_api_key" {
  secret_id = "resend-api-key-${var.environment}"

  replication {
    auto {}
  }
}

resource "google_secret_manager_secret_version" "resend_api_key" {
  secret      = google_secret_manager_secret.resend_api_key.id
  secret_data = "placeholder-replace-with-real-key"

  lifecycle {
    ignore_changes = [secret_data]
  }
}

# Client secret of the Google OAuth client (sign in with Google). Same approach as
# the Resend key: a placeholder here, the real value added by hand and ignored by
# Terraform afterwards:
#   printf '%s' 'GOCSPX-...' | gcloud secrets versions add google-oauth-client-secret-dev --data-file=-
resource "google_secret_manager_secret" "google_client_secret" {
  secret_id = "google-oauth-client-secret-${var.environment}"

  replication {
    auto {}
  }
}

resource "google_secret_manager_secret_version" "google_client_secret" {
  secret      = google_secret_manager_secret.google_client_secret.id
  secret_data = "placeholder-replace-with-real-secret"

  lifecycle {
    ignore_changes = [secret_data]
  }
}
