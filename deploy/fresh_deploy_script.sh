docker build -t europe-west1-docker.pkg.dev/dev-thaniumos/dev-thaniumos-repo/thaniumos-api:v1.0.0 .

gcloud auth configure-docker europe-west1-docker.pkg.dev

docker push europe-west1-docker.pkg.dev/dev-thaniumos/dev-thaniumos-repo/thaniumos-api:v1.0.0 .

kubectl create deployment thaniumos-api --image=europe-west1-docker.pkg.dev/dev-thaniumos/dev-thaniumos-repo/thaniumos-api:v1.0.0

kubectl scale deployment thaniumos-api --replicas=0

kubectl expose deployment thaniumos-api --name=thaniumos-api-service --type=LoadBalancer --port 80 --target-port 3500



kubectl apply -f service.yaml

kubectl apply -f ingress.yaml

kubectl apply -f nginx-ingress-end.yaml




## update existing deployment
docker build -t europe-west1-docker.pkg.dev/dev-thaniumos/dev-thaniumos-repo/thaniumos-api:v1.0.0 .
docker push europe-west1-docker.pkg.dev/dev-thaniumos/dev-thaniumos-repo/thaniumos-api:v1.0.0

kubectl set image deployment/thaniumos-api thaniumos-api=europe-west1-docker.pkg.dev/dev-thaniumos/dev-thaniumos-repo/thaniumos-api:v1.0.0


# DEPLOY BASE64 ENCODED SECRETS
# ENCODE BASE64
printf %s "admin123" | base64 -w0

# DECODE BASE64
printf %s "MTExMTIz" | base64 -d