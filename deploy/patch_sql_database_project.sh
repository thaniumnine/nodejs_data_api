exit 0

gcloud sql instances list \
  --project=dev-thaniumos

gcloud sql instances describe thanium-prod \
  --project=dev-thaniumos \
  --format="yaml(region,settings.ipConfiguration,ipAddresses,pscServiceAttachmentLink)"

gcloud container clusters list \
  --project=prod-thaniumos

gcloud container clusters describe thanium-cluster-1 \
  --project=prod-thaniumos \
  --location=thanium-cluster-1 \
  --format="yaml(network,subnetwork)"

#3. Enable Private Service Connect on SQL Server
#Only perform this step if PSC isn't already enabled.

gcloud sql instances patch thanium-prod \
  --project=dev-thaniumos \
  --enable-private-service-connect \
  --allowed-psc-projects=prod-thaniumos

gcloud sql instances describe thanium-prod \
  --project=dev-thaniumos \
  --format="yaml(settings.ipConfiguration.pscConfig,pscServiceAttachmentLink)"

#assign private ip address reservation
gcloud compute networks subnets describe default \
  --project=prod-thaniumos \
  --region=europe-west1 \
  --format="yaml(ipCidrRange,network)"
#3.2.2 Reserve an internal IP in production

gcloud compute networks subnets describe default \
  --project=prod-thaniumos \
  --region=europe-west1 \
  --format="yaml(ipCidrRange,network)"

gcloud compute addresses create thanium-sql-psc-ip \
  --project=prod-thaniumos \
  --region=europe-west1 \
  --subnet=projects/prod-thaniumos/regions/europe-west1/subnetworks/default
#retrieve it verify
gcloud compute addresses describe thanium-sql-psc-ip \
  --project=prod-thaniumos \
  --region=europe-west1 \
  --format="value(address)"

gcloud compute addresses create default-ip-range-1780329234250 \
  --project=dev-thaniumos \
  --global \
  --purpose=VPC_PEERING \
  --network=projects/dev-thaniumos/global/networks/default \
  --prefix-length=16

gcloud compute addresses describe default-ip-range-1780329234250 \
  --project=dev-thaniumos \
  --global \
  --format="yaml(name,address,prefixLength,purpose,network)"


  gcloud services vpc-peerings update \
  --project=dev-thaniumos \
  --network=default \
  --service=servicenetworking.googleapis.com \
  --ranges=default-ip-range-1780329234250 \
  --force

  gcloud services vpc-peerings list \
  --project=dev-thaniumos \
  --network=default \
  --service=servicenetworking.googleapis.com

  gcloud sql instances describe thanium-prod \
  --project=dev-thaniumos \
  --format="yaml(ipAddresses)"

#4.sql_pvc_create_internal_endpoint

#5. Verify connectivity
#Check whether Google Cloud has accepted the connection:

  gcloud compute forwarding-rules describe sqlserver-psc \
  --project=prod-thaniumos \
  --region="$REGION" \
  --format="yaml(IPAddress,pscConnectionStatus)"

  kubectl run sql-test \
  --rm -it \
  --restart=Never \
  --image=busybox:1.36 \
  -- nc -vz PSC_END_POINT_IP_10 1433