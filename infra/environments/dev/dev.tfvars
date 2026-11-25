# Non-secret settings for dev. Secrets are generated in secrets.tf.
project_id    = "digital-twin-clothing"
environment   = "dev"
project_label = "digital-twin-for-clothing"
region        = "us-east4"
zone          = "us-east4-a"

network_name = "digital-twin-dev-vpc"
subnet_name  = "digital-twin-dev-subnet"
subnet_cidr  = "10.10.0.0/24"

registry_name = "digital-twin-dev"
service_name  = "digitaltwinforclothing"
initial_image = "us-docker.pkg.dev/cloudrun/container/hello"

data_vm_name         = "digital-twin-dev-data"
data_vm_machine_type = "e2-micro"

bucket_name = "digital-twin-clothing-dev-app-storage"

site_url = "https://digitaltwinforclothing-878155745446.us-east4.run.app"
