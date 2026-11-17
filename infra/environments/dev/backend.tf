# State lives in the bucket made by infra/bootstrap. Cloud Storage locks the
# state on every run, so two applies can never run at the same time.
terraform {
  backend "gcs" {
    bucket = "digital-twin-clothing-tfstate"
    prefix = "dev"
  }
}
