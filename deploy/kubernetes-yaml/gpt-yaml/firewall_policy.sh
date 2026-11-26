gcloud compute networks get-effective-firewalls default \
  --project=prod-thaniumos \
  --format="json"

  gcloud services enable networkmanagement.googleapis.com \
  --project=prod-thaniumos

  #verify
  gcloud services list \
  --project=prod-thaniumos \
  --enabled \
  --filter="config.name=networkmanagement.googleapis.com"


  gcloud network-management connectivity-tests create thanium-sql-psc-test \
  --project=prod-thaniumos \
  --source-ip-address=10.164.0.3 \
  --source-network=projects/prod-thaniumos/global/networks/default \
  --source-network-type=GCP_NETWORK \
  --destination-forwarding-rule=projects/prod-thaniumos/regions/europe-west1/forwardingRules/thanium-sql-psc \
  --destination-port=1433 \
  --protocol=TCP