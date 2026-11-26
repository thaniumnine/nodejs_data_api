#4. Create the internal endpoint in prod-thaniumos
#Now we'll create an internal IP address in your production VPC.

export SQL_INSTANCE="prod-thaniumos"
export PROD_VPC="your-prod-vpc"
export PROD_SUBNET="your-prod-subnet"

export REGION=$(gcloud sql instances describe "$SQL_INSTANCE" \
  --project=dev-thaniumos \
  --format="value(region)")

export SERVICE_ATTACHMENT=$(gcloud sql instances describe "$SQL_INSTANCE" \
  --project=dev-thaniumos \
  --format="value(pscServiceAttachmentLink)")

gcloud compute addresses create sqlserver-psc-ip \
  --project=prod-thaniumos \
  --region="$REGION" \
  --subnet="projects/prod-thaniumos/regions/$REGION/subnetworks/$PROD_SUBNET"

gcloud compute forwarding-rules create sqlserver-psc \
  --project=prod-thaniumos \
  --region="$REGION" \
  --network="projects/prod-thaniumos/global/networks/$PROD_VPC" \
  --address=sqlserver-psc-ip \
  --target-service-attachment="$SERVICE_ATTACHMENT" \
  --allow-psc-global-access

  #
SERVICE_ATTACHMENT=$(gcloud sql instances describe thanium-prod \
  --project=dev-thaniumos \
  --format="value(pscServiceAttachmentLink)")

echo "$SERVICE_ATTACHMENT"

gcloud compute forwarding-rules create thanium-sql-psc \
  --project=prod-thaniumos \
  --region=europe-west1 \
  --network=projects/prod-thaniumos/global/networks/default \
  --address=thanium-sql-psc-ip \
  --target-service-attachment="$SERVICE_ATTACHMENT" \
  --allow-psc-global-access

  #verify

  gcloud compute forwarding-rules describe thanium-sql-psc \
  --project=prod-thaniumos \
  --region=europe-west1 \
  --format="yaml(IPAddress,pscConnectionStatus)"

  #list vpc networks

  for PROJECT in dev-thaniumos prod-thaniumos; do
  echo ""
  echo "=========================================="
  echo "PROJECT: $PROJECT"
  echo "=========================================="

  gcloud compute addresses list \
    --project="$PROJECT" \
    --format="table(name,address,region.basename(),addressType,purpose,status)"
done

  RESERVED == bad

##cleanup
kubectl delete pod psc-pod-debug psc-node-debug --ignore-not-found

gcloud network-management connectivity-tests delete thanium-sql-connectivity \
  --project=prod-thaniumos \
  --quiet

