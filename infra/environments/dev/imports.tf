# The Cloud Run service was first created by hand in the console. This block
# brings it under Terraform on the first apply, keeping its URL. Remove this
# file in a follow-up pull request once that apply has succeeded.
import {
  to = module.app.google_cloud_run_v2_service.app
  id = "projects/${var.project_id}/locations/${var.region}/services/${var.service_name}"
}
